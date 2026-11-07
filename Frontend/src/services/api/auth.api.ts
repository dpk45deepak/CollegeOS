import { apiClient } from "@/lib/api/client";
import { User, UserRole } from "@/types";

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: string;
  sessionId?: string;
}

export interface BackendLoginDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  sessionId: string;
}

export interface BackendUserProfile {
  id: string;
  collegeId: string;
  loginId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: string;
  userRoles?: Array<{
    role: { key: string };
    departmentId?: string | null;
  }>;
}

export function mapBackendRole(roleKey?: string): UserRole {
  switch (roleKey) {
    case "SUPER_ADMIN":
    case "COLLEGE_ADMIN":
      return "ADMIN";
    case "TEACHER":
      return "TEACHER";
    case "HOD":
      return "HOD";
    case "PLACEMENT_OFFICER":
      return "PLACEMENT_OFFICER";
    case "ACCOUNTANT":
      return "ACCOUNTANT";
    case "STUDENT":
    default:
      return "STUDENT";
  }
}

export function normalizeUserProfile(raw: BackendUserProfile): User {
  const primaryRoleKey = raw.userRoles?.[0]?.role?.key;
  const role = mapBackendRole(primaryRoleKey);
  const fullName = `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || raw.loginId;

  return {
    id: raw.id,
    name: fullName,
    email: raw.email,
    role,
    rollNumber: raw.loginId,
    phone: raw.phone || undefined,
  };
}

export const authApi = {
  login: async (
    loginId: string,
    password: string,
    collegeCode: string = process.env.NEXT_PUBLIC_COLLEGE_SHORT_CODE || "SDCET"
  ): Promise<LoginResponse> => {
    const tokens = await apiClient<BackendLoginDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        loginId,
        password,
        collegeCode,
      }),
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("college_os_token", tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem("college_os_refresh_token", tokens.refreshToken);
      }
    }

    const rawProfile = await apiClient<BackendUserProfile>("/users/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    const user = normalizeUserProfile(rawProfile);
    if (typeof window !== "undefined") {
      localStorage.setItem("college_os_user", JSON.stringify(user));
    }

    return {
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      sessionId: tokens.sessionId,
    };
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("college_os_token");
        localStorage.removeItem("college_os_refresh_token");
        localStorage.removeItem("college_os_user");
      }
    }
  },

  logoutAll: async (): Promise<void> => {
    try {
      await apiClient<void>("/auth/logout-all", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("college_os_token");
        localStorage.removeItem("college_os_refresh_token");
        localStorage.removeItem("college_os_user");
      }
    }
  },

  getSessions: async () => {
    return apiClient<any[]>("/auth/sessions");
  },

  revokeSession: async (sessionId: string) => {
    return apiClient<void>(`/auth/sessions/${sessionId}`, { method: "DELETE" });
  },

  forgotPassword: async (collegeCode: string, email: string) => {
    return apiClient<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ collegeCode, email }),
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

