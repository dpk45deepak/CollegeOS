import { apiClient } from "@/lib/api/client";

export interface UserItem {
  id: string;
  collegeId: string;
  loginId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | "SUSPENDED" | "PENDING_VERIFICATION";
  createdAt: string;
  userRoles?: Array<{
    id: string;
    role: { id: string; key: string; name: string };
    departmentId?: string | null;
    department?: { id: string; name: string; code: string };
  }>;
}

export interface CreateUserDto {
  loginId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  departmentIds?: string[];
  initialPassword?: string;
}

export interface UsersListQuery {
  [key: string]: string | number | boolean | null | undefined;
  page?: number;
  limit?: number;
  search?: string;
}

export const usersApi = {
  me: async (): Promise<UserItem> => {
    return apiClient<UserItem>("/users/me");
  },

  list: async (params?: UsersListQuery): Promise<{ items: UserItem[]; total: number; page: number; limit: number } | UserItem[]> => {
    return apiClient<any>("/users", { params });
  },

  create: async (dto: CreateUserDto): Promise<UserItem> => {
    const normalizedRoles = (dto.roles || []).map((r) => {
      if (r === "ADMIN") return "COLLEGE_ADMIN";
      if (r === "EXAM_OFFICER") return "EXAM_CONTROLLER";
      if (r === "LIBRARIAN") return "LIBRARY_STAFF";
      return r;
    });

    return apiClient<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify({
        ...dto,
        roles: normalizedRoles,
      }),
    });
  },

  updateRoles: async (id: string, roles: string[], departmentIds?: string[]): Promise<UserItem> => {
    return apiClient<UserItem>(`/users/${id}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles, departmentIds }),
    });
  },

  updateStatus: async (id: string, status: "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING_VERIFICATION" | "SUSPENDED"): Promise<UserItem> => {
    const normalized = status === "SUSPENDED" ? "INACTIVE" : status;
    return apiClient<UserItem>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: normalized }),
    });
  },
};
