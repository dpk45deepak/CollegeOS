import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi, CreateExamDto } from "@/services/api/exams.api";

export const examKeys = {
  all: ["exams"] as const,
  list: (params?: any) => [...examKeys.all, "list", params] as const,
  results: (id: string) => [...examKeys.all, "results", id] as const,
  schemes: () => [...examKeys.all, "schemes"] as const,
};

export function useExams(params?: { upcoming?: boolean; subjectOfferingId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: examKeys.list(params),
    queryFn: () => examsApi.list(params),
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateExamDto) => examsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.all }),
  });
}

export function useCancelExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.all }),
  });
}

export function useExamResults(examId: string) {
  return useQuery({
    queryKey: examKeys.results(examId),
    queryFn: () => examsApi.getResults(examId),
    enabled: !!examId,
  });
}

export function useEnterExamResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, results, reason }: { id: string; results: Array<{ studentId: string; marksObtained: number }>; reason?: string }) =>
      examsApi.enterResults(id, results, reason),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: examKeys.results(vars.id) }),
  });
}

export function usePublishExamResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => examsApi.publishResults(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useGradingSchemes() {
  return useQuery({
    queryKey: examKeys.schemes(),
    queryFn: () => examsApi.listGradingSchemes(),
  });
}

export function useCreateGradingScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: examsApi.createGradingScheme,
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.schemes() }),
  });
}

