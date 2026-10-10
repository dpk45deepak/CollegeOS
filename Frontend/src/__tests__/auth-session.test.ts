import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "../lib/api/auth";
import { apiClient, ApiError } from "../lib/api/client";
import { useAuthStore } from "../lib/auth/authStore";

// Mock localStorage for test environment
const storageMock: Record<string, string> = {};
const fakeLocalStorage = {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, val: string) => {
    storageMock[key] = val;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
  clear: () => {
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  },
};

if (typeof global.window === "undefined") {
  (global as any).window = global;
}
(global as any).localStorage = fakeLocalStorage;

describe("Authentication & Session Management Integration", () => {
  beforeEach(() => {
    fakeLocalStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.restoreAllMocks();
  });

  it("authenticates valid credentials against POST /auth/login and GET /users/me, setting session state", async () => {
    const mockTokens = {
      accessToken: "test_access_jwt_123",
      refreshToken: "test_refresh_jwt_456",
      expiresIn: "900s",
      sessionId: "sess_abc_1",
    };

    const mockProfile = {
      id: "usr_student_1",
      collegeId: "clg_sdiet",
      loginId: "21CS042",
      email: "student@sdiet.edu",
      firstName: "Arun",
      lastName: "Verma",
      phone: "+91-9876543210",
      status: "ACTIVE",
      userRoles: [{ role: { key: "STUDENT" } }],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/auth/login")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: mockTokens,
          }),
        });
      }
      if (url.includes("/users/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: mockProfile,
          }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    const user = await useAuthStore.getState().login("21CS042", "Password@123", "SDIET");
    expect(user).toBeDefined();
    expect(user.name).toBe("Arun Verma");
    expect(user.role).toBe("STUDENT");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe("Arun Verma");
    expect(state.user?.role).toBe("STUDENT");
    expect(fakeLocalStorage.getItem("college_os_token")).toBe("test_access_jwt_123");
    expect(fakeLocalStorage.getItem("college_os_refresh_token")).toBe("test_refresh_jwt_456");
  });

  it("handles invalid credentials by setting error and throwing ApiError", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Invalid credentials",
        errorCode: "AUTH_UNAUTHORIZED",
      }),
    });

    await expect(
      useAuthStore.getState().login("wrong_id", "wrong_pass", "SDIET")
    ).rejects.toThrowError(ApiError);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("restores user session via GET /users/me when valid token exists in storage", async () => {
    fakeLocalStorage.setItem("college_os_token", "existing_valid_token");

    const mockProfile = {
      id: "usr_teacher_1",
      collegeId: "clg_sdiet",
      loginId: "FAC-CSE-108",
      email: "teacher@sdiet.edu",
      firstName: "Dr. Vikram",
      lastName: "Sharma",
      status: "ACTIVE",
      userRoles: [{ role: { key: "TEACHER" } }],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockProfile,
      }),
    });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe("TEACHER");
    expect(state.user?.name).toBe("Dr. Vikram Sharma");
  });

  it("clears session tokens and state upon logout", async () => {
    fakeLocalStorage.setItem("college_os_token", "active_token");
    useAuthStore.setState({
      user: { id: "1", role: "STUDENT" } as any,
      isAuthenticated: true,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { loggedOut: true } }),
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(fakeLocalStorage.getItem("college_os_token")).toBeNull();
    expect(fakeLocalStorage.getItem("college_os_refresh_token")).toBeNull();
  });

  it("verifies apiClient rejects unauthenticated requests with ApiError and does NOT use demo fallback", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Missing bearer token",
      }),
    });

    await expect(apiClient("/students/me/dashboard")).rejects.toThrowError(ApiError);
  });
});
