import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feesApi, CreateFeeStructureDto } from "@/services/api/fees.api";

export const feeKeys = {
  all: ["fees"] as const,
  structures: () => [...feeKeys.all, "structures"] as const,
  studentFees: (params?: any) => [...feeKeys.all, "studentFees", params] as const,
  receipt: (id: string) => [...feeKeys.all, "receipt", id] as const,
};

export function useFeeStructures() {
  return useQuery({
    queryKey: feeKeys.structures(),
    queryFn: () => feesApi.listStructures(),
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFeeStructureDto) => feesApi.createStructure(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: feeKeys.structures() }),
  });
}

export function useAssignFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, dto }: { structureId: string; dto: { studentIds?: string[]; batchId?: string; dueDate: string } }) =>
      feesApi.assignStructure(structureId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: feeKeys.studentFees() }),
  });
}

export function useStudentFees(params?: { status?: string; studentId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: feeKeys.studentFees(params),
    queryFn: () => feesApi.listStudentFees(params),
  });
}

export function useAdjustFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentFeeId, dto }: { studentFeeId: string; dto: { discount?: number; scholarshipAdjustment?: number; reason: string } }) =>
      feesApi.adjustFee(studentFeeId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: feeKeys.studentFees() }),
  });
}

export function useStartPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentFeeId, dto }: { studentFeeId: string; dto?: { gateway?: string; amount?: number } }) =>
      feesApi.startPayment(studentFeeId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feeKeys.studentFees() });
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useRecordManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentFeeId, dto }: { studentFeeId: string; dto: { amount: number; mode: string; reference?: string } }) =>
      feesApi.recordManualPayment(studentFeeId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feeKeys.studentFees() });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

