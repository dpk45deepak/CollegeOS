// Centralized Typed API Client for College OS
// Connects to NestJS REST API with transparent response envelope unwrapping and strict error handling.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
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

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, skipAuth, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
      `Network connection failed. Could not reach server at ${BASE_URL}.`,
      error
    );
  }
}
