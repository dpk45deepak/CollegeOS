import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scholarshipsApi, CreateScholarshipDto, ScholarshipType } from "@/services/api/scholarships.api";

export const scholarshipKeys = {
  all: ["scholarships"] as const,
  list: (params?: any) => [...scholarshipKeys.all, "list", params] as const,
  matches: () => [...scholarshipKeys.all, "matches"] as const,
  mine: () => [...scholarshipKeys.all, "mine"] as const,
};

export function useScholarships(params?: { type?: ScholarshipType; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: scholarshipKeys.list(params),
    queryFn: () => scholarshipsApi.list(params),
  });
}

export function useScholarshipMatches() {
  return useQuery({
    queryKey: scholarshipKeys.matches(),
    queryFn: () => scholarshipsApi.matchesForStudent(),
  });
}

export function useMyScholarshipApplications() {
  return useQuery({
    queryKey: scholarshipKeys.mine(),
    queryFn: () => scholarshipsApi.myApplications(),
  });
}

export function useExpressScholarshipInterest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scholarshipsApi.expressInterest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: scholarshipKeys.all }),
  });
}

export function useApplyScholarship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scholarshipsApi.apply(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: scholarshipKeys.all }),
  });
}

export function useCreateScholarship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateScholarshipDto) => scholarshipsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: scholarshipKeys.all }),
  });
}

export function useUpdateScholarship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateScholarshipDto> }) =>
      scholarshipsApi.update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: scholarshipKeys.all }),
  });
}

export function useScholarshipDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scholarshipId, studentId, status }: { scholarshipId: string; studentId: string; status: "APPROVED" | "REJECTED" | "DISBURSED" }) =>
      scholarshipsApi.recordDecision(scholarshipId, studentId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: scholarshipKeys.all }),
  });
}

