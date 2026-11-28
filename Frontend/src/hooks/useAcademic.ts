import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { academicApi } from "@/services/api/academic.api";

export const academicKeys = {
  all: ["academic"] as const,
  colleges: () => [...academicKeys.all, "colleges"] as const,
  settings: () => [...academicKeys.all, "settings"] as const,
  campuses: () => [...academicKeys.all, "campuses"] as const,
  departments: () => [...academicKeys.all, "departments"] as const,
  programs: () => [...academicKeys.all, "programs"] as const,
  batches: (params?: any) => [...academicKeys.all, "batches", params] as const,
  semesters: (batchId?: string) => [...academicKeys.all, "semesters", batchId] as const,
  sections: (semesterId?: string) => [...academicKeys.all, "sections", semesterId] as const,
  subjects: (params?: any) => [...academicKeys.all, "subjects", params] as const,
};

export function useColleges(enabled = true) {
  return useQuery({
    queryKey: academicKeys.colleges(),
    queryFn: () => academicApi.listColleges(),
    enabled,
  });
}

export function useCreateCollege() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createCollege,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.colleges() }),
  });
}

export function useCollegeSettings() {
  return useQuery({
    queryKey: academicKeys.settings(),
    queryFn: () => academicApi.getCurrentCollege(),
  });
}

export function useUpdateCollegeSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.settings() }),
  });
}

export function useCampuses() {
  return useQuery({
    queryKey: academicKeys.campuses(),
    queryFn: () => academicApi.listCampuses(),
  });
}

export function useCreateCampus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createCampus,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.campuses() }),
  });
}

export function useUpdateCampus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<{ code: string; name: string; address?: string }> }) =>
      academicApi.updateCampus(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.campuses() }),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: academicKeys.departments(),
    queryFn: () => academicApi.listDepartments(),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.departments() }),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => academicApi.updateDepartment(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.departments() }),
  });
}

export function usePrograms() {
  return useQuery({
    queryKey: academicKeys.programs(),
    queryFn: () => academicApi.listPrograms(),
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createProgram,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.programs() }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<{ code: string; name: string; durationSemesters: number }> }) =>
      academicApi.updateProgram(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.programs() }),
  });
}

export function useBatches(params?: { departmentId?: string; programId?: string }) {
  return useQuery({
    queryKey: academicKeys.batches(params),
    queryFn: () => academicApi.listBatches(params),
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.all }),
  });
}

export function useSemesters(batchId?: string) {
  return useQuery({
    queryKey: academicKeys.semesters(batchId),
    queryFn: () => academicApi.listSemesters(batchId),
  });
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createSemester,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.all }),
  });
}

export function useUpdateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => academicApi.updateSemester(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.all }),
  });
}

export function useSections(semesterId?: string) {
  return useQuery({
    queryKey: academicKeys.sections(semesterId),
    queryFn: () => academicApi.listSections(semesterId),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createSection,
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.all }),
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<{ name: string; capacity: number }> }) =>
      academicApi.updateSection(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: academicKeys.all }),
  });
}

export function useSubjects(params?: { departmentId?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: academicKeys.subjects(params),
    queryFn: () => academicApi.listSubjects(params),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: academicApi.createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: [...academicKeys.all, "subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => academicApi.updateSubject(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...academicKeys.all, "subjects"] }),
  });
}

