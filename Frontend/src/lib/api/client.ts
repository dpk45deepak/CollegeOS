// Centralized Typed API Client for College OS
// Connects to NestJS REST API with transparent response envelope unwrapping,
// automatic 401 token refresh rotation, and strict error handling.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const RAW_BASE_URL = API_BASE_URL;

export const TOKEN_KEY = "college_os_token";
export const REFRESH_TOKEN_KEY = "college_os_refresh_token";
export const USER_KEY = "college_os_user";

export function getAuthStorage(preferSession = false): Storage | null {
  if (typeof window === "undefined") return null;
  if (preferSession && typeof sessionStorage !== "undefined") return sessionStorage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
}

export function getStoredItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  if (fromLocal !== null) return fromLocal;
  return typeof sessionStorage !== "undefined" ? sessionStorage.getItem(key) : null;
}

export function setAuthItems(items: Record<string, string | undefined>, rememberMe = true): void {
  if (typeof window === "undefined") return;
  const hasLocal = typeof localStorage !== "undefined";
  const hasSession = typeof sessionStorage !== "undefined";
  const target = rememberMe
    ? (hasLocal ? localStorage : hasSession ? sessionStorage : null)
    : (hasSession ? sessionStorage : hasLocal ? localStorage : null);
  const other = rememberMe
    ? (hasSession ? sessionStorage : null)
    : (hasLocal ? localStorage : null);
  if (!target) return;
  Object.entries(items).forEach(([k, v]) => {
    try {
      other?.removeItem(k);
    } catch {
      // ignore storage errors
    }
    if (v !== undefined) {
      target.setItem(k, v);
    }
  });
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  const keys = [TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, "college_os_demo_mode", "college_os_demo_role", "college_os_tenant_id"];
  keys.forEach((k) => {
    try {
      localStorage?.removeItem(k);
    } catch {
      // ignore
    }
    try {
      sessionStorage?.removeItem(k);
    } catch {
      // ignore
    }
  });
}

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return RAW_BASE_URL;
  }
  // SSR fallback
  if (RAW_BASE_URL.startsWith("http")) {
    return RAW_BASE_URL;
  }
  const backend = process.env.BACKEND_INTERNAL_URL || "http://localhost:4000";
  return `${backend}${RAW_BASE_URL.startsWith("/") ? RAW_BASE_URL : `/${RAW_BASE_URL}`}`;
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  _retry?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
    public errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Single in-flight refresh promise to deduplicate concurrent 401 responses
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = getStoredItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const usedSessionStorage =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(REFRESH_TOKEN_KEY) !== null &&
    (typeof localStorage === "undefined" || localStorage.getItem(REFRESH_TOKEN_KEY) === null);

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseUrl = getBaseUrl();
        const refreshUrl = `${baseUrl}/auth/refresh`;
        const res = await fetch(refreshUrl, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          throw new Error("Refresh token rejected");
        }

        const data = await res.json();
        const tokens = data?.data || data;
        if (tokens?.accessToken) {
          setAuthItems(
            {
              [TOKEN_KEY]: tokens.accessToken,
              ...(tokens.refreshToken ? { [REFRESH_TOKEN_KEY]: tokens.refreshToken } : {}),
            },
            !usedSessionStorage
          );
          return tokens.accessToken as string;
        }
        return null;
      } catch {
        clearStoredAuth();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, skipAuth, _retry, ...customConfig } = options;
  const baseUrl = getBaseUrl();

  let url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Token retrieval from local or session storage
  let token: string | null = null;
  if (typeof window !== "undefined" && !skipAuth) {
    token = getStoredItem(TOKEN_KEY);
  }

  const isFormData = typeof FormData !== "undefined" && customConfig.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      credentials: "include", // For HttpOnly session cookies & CORS credentials
      headers: {
        ...defaultHeaders,
        ...(headers as Record<string, string>),
      },
      ...customConfig,
    });

    if (res.status === 204) {
      return null as T;
    }

    // Transparent 401 handling: attempt token refresh rotation once
    if (
      res.status === 401 &&
      !_retry &&
      !skipAuth &&
      !endpoint.includes("/auth/refresh") &&
      !endpoint.includes("/auth/login") &&
      typeof window !== "undefined"
    ) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiClient<T>(endpoint, {
          ...options,
          _retry: true,
        });
      }
    }

    const responseBody = typeof res.json === "function" ? await res.json().catch(() => ({})) : {};

    if (!res.ok) {
      const rawMsg = responseBody?.message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(", ")
        : rawMsg || `Request failed with status ${res.status}`;
      const errorCode = responseBody?.errorCode || `HTTP_${res.status}`;

      throw new ApiError(res.status, message, responseBody, errorCode);
    }

    // Backend wraps successful responses in { success: true, data: T, meta?: any }
    if (
      responseBody &&
      typeof responseBody === "object" &&
      "success" in responseBody &&
      responseBody.success === true &&
      "data" in responseBody
    ) {
      const payload = responseBody.data;
      if (payload && typeof payload === "object" && "meta" in responseBody && responseBody.meta) {
        Object.defineProperty(payload, "__meta", {
          value: responseBody.meta,
          enumerable: false,
          configurable: true,
        });
      }
      return payload as T;
    }

    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network connectivity or offline failure
    throw new ApiError(
      0,
      `Network connection failed. Could not reach server at ${baseUrl}.`,
      error
    );
  }
}

/** Downloads binary content using full credentials & 401 refresh rotation. */
export async function apiDownload(
  endpoint: string,
  suggestedName?: string,
  _retry = false
): Promise<void> {
  const baseUrl = getBaseUrl();
  const normalizedPath = endpoint.startsWith(baseUrl)
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = typeof window !== "undefined" ? getStoredItem(TOKEN_KEY) : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(normalizedPath, {
    credentials: "include",
    headers,
  });

  if (res.status === 401 && !_retry && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiDownload(endpoint, suggestedName, true);
    }
  }

  if (!res.ok) {
    const errBody = typeof res.json === "function" ? await res.json().catch(() => ({})) : {};
    throw new ApiError(
      res.status,
      errBody?.message || `Download failed with status ${res.status}`,
      errBody,
      errBody?.errorCode || `HTTP_${res.status}`
    );
  }

  const blob = await res.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = suggestedName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export async function apiClientWithMeta<T>(
  endpoint: string,
  options: Parameters<typeof apiClient>[1] = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const data = await apiClient<T>(endpoint, options);
  const meta =
    (data && typeof data === "object" && "__meta" in (data as any)
      ? (data as any).__meta
      : !Array.isArray(data) && data && typeof data === "object" && "total" in (data as any)
        ? (data as any)
        : undefined) as ApiMeta | undefined;
  return { data, meta };
}
