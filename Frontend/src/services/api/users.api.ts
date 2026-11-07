import { apiClient } from "@/lib/api/client";

export interface UserItem {
  id: string;
  collegeId: string;
  loginId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
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
    return apiClient<UserItem>("/users", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateRoles: async (id: string, roles: string[], departmentIds?: string[]): Promise<UserItem> => {
    return apiClient<UserItem>(`/users/${id}/roles`, {
      method: "PATCH",
      body: JSON.stringify({ roles, departmentIds }),
    });
  },

  updateStatus: async (id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION"): Promise<UserItem> => {
    return apiClient<UserItem>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
