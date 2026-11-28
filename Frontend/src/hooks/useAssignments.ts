import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi, CreateAssignmentDto } from "@/services/api/assignments.api";

export const assignmentKeys = {
  all: ["assignments"] as const,
  list: (params?: any) => [...assignmentKeys.all, "list", params] as const,
  submissions: (id: string, params?: any) => [...assignmentKeys.all, "submissions", id, params] as const,
  missing: (id: string) => [...assignmentKeys.all, "missing", id] as const,
};

export function useAssignments(params?: { subjectOfferingId?: string; pending?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: () => assignmentsApi.list(params),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssignmentDto) => assignmentsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: assignmentKeys.all }),
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, dto }: { assignmentId: string; dto: { text?: string; fileKeys?: string[] } }) =>
      assignmentsApi.submit(assignmentId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useAssignmentSubmissions(assignmentId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: assignmentKeys.submissions(assignmentId, params),
    queryFn: () => assignmentsApi.getSubmissions(assignmentId, params),
    enabled: !!assignmentId,
  });
}

export function useAssignmentMissing(assignmentId: string) {
  return useQuery({
    queryKey: assignmentKeys.missing(assignmentId),
    queryFn: () => assignmentsApi.getMissingSubmissions(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, dto }: { submissionId: string; dto: { marks: number; feedback?: string } }) =>
      assignmentsApi.gradeSubmission(submissionId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.all });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

