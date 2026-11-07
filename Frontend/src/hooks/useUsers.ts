import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, CreateUserDto, UsersListQuery } from "@/services/api/users.api";

export const userKeys = {
  all: ["users"] as const,
  list: (params?: UsersListQuery) => [...userKeys.all, "list", params] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export function useUsers(params?: UsersListQuery) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useUserMe() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => usersApi.me(),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles, departmentIds }: { id: string; roles: string[]; departmentIds?: string[] }) =>
      usersApi.updateRoles(id, roles, departmentIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" }) =>
      usersApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
}

