import { apiClient } from "./client";
import { User, UserRole } from "@/types";
import { mockUsers } from "./mockData";

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (email: string, _password: string): Promise<LoginResponse> => {
    return apiClient<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password: _password }),
      },
      () => {
        // Find matching role or default to student
        let matchedUser = mockUsers.student;
        const normalized = email.toLowerCase();

        if (normalized.includes("teacher") || normalized.includes("sharma") || normalized.includes("fac")) {
          matchedUser = mockUsers.teacher;
        } else if (normalized.includes("hod") || normalized.includes("sen")) {
          matchedUser = mockUsers.hod;
        } else if (normalized.includes("admin")) {
          matchedUser = mockUsers.admin;
        } else if (normalized.includes("tpo") || normalized.includes("placement")) {
          matchedUser = mockUsers.placement;
        } else if (normalized.includes("finance") || normalized.includes("accountant")) {
          matchedUser = mockUsers.accountant;
        }

        return {
          user: matchedUser,
          token: `demo_jwt_token_${matchedUser.role}_${Date.now()}`,
        };
      }
    );
  },

  switchRole: (role: UserRole): LoginResponse => {
    let user = mockUsers.student;
    if (role === "TEACHER") user = mockUsers.teacher;
    if (role === "HOD") user = mockUsers.hod;
    if (role === "ADMIN") user = mockUsers.admin;
    if (role === "PLACEMENT_OFFICER") user = mockUsers.placement;
    if (role === "ACCOUNTANT") user = mockUsers.accountant;

    return {
      user,
      token: `demo_jwt_token_${role}_${Date.now()}`,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient<User>("/auth/me", {}, () => mockUsers.student);
  },

  logout: async (): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(
      "/auth/logout",
      { method: "POST" },
      () => ({ success: true })
    );
  },
};
