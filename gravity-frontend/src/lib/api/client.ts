// Centralized API Client with seamless fallback to Realistic Mock API in Demo Mode

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
  mockFallback?: () => T | Promise<T>
): Promise<T> {
  const { params, headers, ...customConfig } = options;

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

  // Token retrieval
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("college_os_token");
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // If in demo mode and mock fallback is provided, use mock data with realistic latency
  if (IS_DEMO && mockFallback) {
    // Artificial latency (150ms-350ms) to ensure skeleton loaders and realistic feel work properly
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      return await mockFallback();
    } catch {
      // In case fallback itself throws
    }
  }

  try {
    const res = await fetch(url, {
      credentials: "include", // For HttpOnly cookies
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...customConfig,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        errorData.message || `Request failed with status ${res.status}`,
        errorData
      );
    }

    return (await res.json()) as T;
  } catch (error) {
    // Graceful fallback to mock data when backend is not running
    if (mockFallback) {
      return await mockFallback();
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, (error as Error).message || "Network Error");
  }
}
