// Centralized Typed API Client for College OS
// Connects to NestJS REST API with transparent response envelope unwrapping,
// automatic 401 token refresh rotation, and strict error handling.

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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

  const refreshToken = localStorage.getItem("college_os_refresh_token");
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseUrl = getBaseUrl();
        const refreshUrl = `${baseUrl}/auth/refresh`;
        const res = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          throw new Error("Refresh token rejected");
        }

        const data = await res.json();
        const tokens = data?.data || data;
        if (tokens?.accessToken) {
          localStorage.setItem("college_os_token", tokens.accessToken);
          if (tokens.refreshToken) {
            localStorage.setItem("college_os_refresh_token", tokens.refreshToken);
          }
          return tokens.accessToken as string;
        }
        return null;
      } catch {
        // Clear expired auth session
        localStorage.removeItem("college_os_token");
        localStorage.removeItem("college_os_refresh_token");
        localStorage.removeItem("college_os_user");
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

  // Token retrieval from local session
  let token: string | null = null;
  if (typeof window !== "undefined" && !skipAuth) {
    token = localStorage.getItem("college_os_token");
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

    const responseBody = await res.json().catch(() => ({}));

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
      return responseBody.data as T;
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
