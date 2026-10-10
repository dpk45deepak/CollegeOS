import { apiClient } from "./client";
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
    collegeCode: string = process.env.NEXT_PUBLIC_COLLEGE_SHORT_CODE || "SDIET"
  ): Promise<LoginResponse> => {
    // Call NestJS POST /api/v1/auth/login
    const tokens = await apiClient<BackendLoginDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        loginId,
        password,
        collegeCode,
      }),
    });

    // Save token temporarily so subsequent /users/me request has authorization header
    if (typeof window !== "undefined") {
      localStorage.setItem("college_os_token", tokens.accessToken);
    }

    // Fetch the authenticated user's verified role and profile from /api/v1/users/me
    const rawProfile = await apiClient<BackendUserProfile>("/users/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    const user = normalizeUserProfile(rawProfile);

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
    await apiClient<void>("/auth/logout", { method: "POST" });
  },
};
