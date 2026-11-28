import { apiClient, clearStoredAuth, setAuthItems, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "@/lib/api/client";
import { User } from "@/types";
import { BackendLoginDto, BackendUserProfile, LoginResponse, mapBackendRole, normalizeUserProfile } from "@/lib/api/auth";

export type { LoginResponse, BackendLoginDto, BackendUserProfile };
export { mapBackendRole, normalizeUserProfile };

export const authApi = {
  login: async (
    loginId: string,
    password: string,
    collegeCode?: string
  ): Promise<LoginResponse> => {
    const payload: Record<string, string> = { loginId, password };
    const code = (collegeCode ?? process.env.NEXT_PUBLIC_COLLEGE_SHORT_CODE ?? "SDIET").trim();
    if (code) {
      payload.collegeCode = code;
    }
    const tokens = await apiClient<BackendLoginDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setAuthItems(
      {
        [TOKEN_KEY]: tokens.accessToken,
        ...(tokens.refreshToken ? { [REFRESH_TOKEN_KEY]: tokens.refreshToken } : {}),
      },
      true
    );

    try {
      const rawProfile = await apiClient<BackendUserProfile>("/users/me", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      const user = normalizeUserProfile(rawProfile);
      setAuthItems({ [USER_KEY]: JSON.stringify(user) }, true);

      return {
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        sessionId: tokens.sessionId,
      };
    } catch (err) {
      clearStoredAuth();
      throw err;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const raw = await apiClient<BackendUserProfile>("/users/me");
    return normalizeUserProfile(raw);
  },

  refresh: async (refreshToken: string): Promise<BackendLoginDto> => {
    return apiClient<BackendLoginDto>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient<void>("/auth/logout", { method: "POST" });
    } finally {
      clearStoredAuth();
    }
  },

  logoutAll: async (): Promise<void> => {
    try {
      await apiClient<void>("/auth/logout-all", { method: "POST" });
    } finally {
      clearStoredAuth();
    }
  },

  getSessions: async () => {
    return apiClient<any[]>("/auth/sessions");
  },

  revokeSession: async (sessionId: string) => {
    return apiClient<void>(`/auth/sessions/${sessionId}`, { method: "DELETE" });
  },

  forgotPassword: async (collegeCode: string | undefined, email: string) => {
    const payload: Record<string, string> = { email };
    if (collegeCode?.trim()) payload.collegeCode = collegeCode.trim();
    return apiClient<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  resetPassword: async (token: string, newPassword: string) => {
    return apiClient<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  verifyEmail: async (token: string) => {
    return apiClient<void>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

