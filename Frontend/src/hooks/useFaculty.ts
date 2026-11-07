import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facultyApi, CreateTeacherDto, CreateOfferingDto, LeaveRequestDto } from "@/services/api/faculty.api";

export const facultyKeys = {
  all: ["faculty"] as const,
  teachers: (params?: any) => [...facultyKeys.all, "teachers", params] as const,
  me: () => [...facultyKeys.all, "me"] as const,
  offerings: (params?: any) => [...facultyKeys.all, "offerings", params] as const,
  roster: (offeringId: string) => [...facultyKeys.all, "roster", offeringId] as const,
};

export function useTeachers(params?: { departmentId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: facultyKeys.teachers(params),
    queryFn: () => facultyApi.list(params),
  });
}

export function useTeacherMe() {
  return useQuery({
    queryKey: facultyKeys.me(),
    queryFn: () => facultyApi.getMe(),
  });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTeacherDto) => facultyApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: facultyKeys.teachers() }),
  });
}

export function useSubjectOfferings(params?: { sectionId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: facultyKeys.offerings(params),
    queryFn: () => facultyApi.listOfferings(params),
  });
}

export function useCreateSubjectOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOfferingDto) => facultyApi.createOffering(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: facultyKeys.offerings() }),
  });
}

export function useOfferingRoster(offeringId: string) {
  return useQuery({
    queryKey: facultyKeys.roster(offeringId),
    queryFn: () => facultyApi.getRoster(offeringId),
    enabled: !!offeringId,
  });
}

export function useEnrollStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offeringId, studentIds }: { offeringId: string; studentIds: string[] }) =>
      facultyApi.enrollStudents(offeringId, studentIds),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: facultyKeys.roster(vars.offeringId) }),
  });
}

export function useRequestLeave() {
  return useMutation({
    mutationFn: (dto: LeaveRequestDto) => facultyApi.requestLeave(dto),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyApi.approveLeave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance", "corrections"] }),
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facultyApi.rejectLeave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance", "corrections"] }),
  });
}

