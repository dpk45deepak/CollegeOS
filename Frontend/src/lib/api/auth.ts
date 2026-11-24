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
    case "EXAM_CONTROLLER":
      return "EXAM_CONTROLLER";
    case "PARENT":
      return "PARENT";
    case "SUPPORT_STAFF":
      return "SUPPORT_STAFF";
    case "LIBRARY_STAFF":
      return "LIBRARY_STAFF";
    case "STUDENT":
    default:
      return "STUDENT";
  }
}

export function normalizeUserProfile(raw: BackendUserProfile): User {
  const roleKeys = (raw.userRoles || []).map((ur) => ur.role?.key).filter(Boolean);
  let role: UserRole = "STUDENT";
  if (roleKeys.includes("SUPER_ADMIN") || roleKeys.includes("COLLEGE_ADMIN")) {
    role = "ADMIN";
  } else if (roleKeys.includes("HOD")) {
    role = "HOD";
  } else if (roleKeys.includes("EXAM_CONTROLLER")) {
    role = "EXAM_CONTROLLER";
  } else if (roleKeys.includes("ACCOUNTANT")) {
    role = "ACCOUNTANT";
  } else if (roleKeys.includes("PLACEMENT_OFFICER")) {
    role = "PLACEMENT_OFFICER";
  } else if (roleKeys.includes("TEACHER")) {
    role = "TEACHER";
  } else if (roleKeys.includes("PARENT")) {
    role = "PARENT";
  } else if (roleKeys.includes("SUPPORT_STAFF")) {
    role = "SUPPORT_STAFF";
  } else if (roleKeys.includes("LIBRARY_STAFF")) {
    role = "LIBRARY_STAFF";
  } else if (roleKeys.length > 0) {
    role = mapBackendRole(roleKeys[0]);
  }
  const fullName = `${raw.firstName || ""} ${raw.lastName || ""}`.trim() || raw.loginId;

  return {
    id: raw.id,
    name: fullName,
    email: raw.email,
    role,
    roles: roleKeys,
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
