import { apiClient } from "@/lib/api/client";

export interface FeeComponent {
  name: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  name: string;
  academicYear: string;
  programId?: string | null;
  batchId?: string | null;
  components: FeeComponent[];
  program?: { name: string; code: string };
  batch?: { name: string };
}

export interface StudentFeeItem {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  paidAmount: number;
  outstanding: number;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  feeStructure?: FeeStructure;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
    batch?: { name: string };
  };
  payments?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  studentFeeId: string;
  amount: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
  paidAt: string;
  gateway: string;
  receiptNo?: string;
  mode?: string;
}

export interface CreateFeeStructureDto {
  name: string;
  academicYear: string;
  programId?: string;
  batchId?: string;
  components: FeeComponent[];
}

export const feesApi = {
  createStructure: async (dto: CreateFeeStructureDto): Promise<FeeStructure> => {
    return apiClient<FeeStructure>("/fees/structures", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listStructures: async (): Promise<FeeStructure[]> => {
    const raw = await apiClient<any>("/fees/structures");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  assignStructure: async (structureId: string, dto: { studentIds?: string[]; batchId?: string; dueDate: string }) => {
    return apiClient<any>(`/fees/structures/${structureId}/assign`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listStudentFees: async (params?: { status?: string; studentId?: string; page?: number; limit?: number }): Promise<StudentFeeItem[]> => {
    const raw = await apiClient<any>("/fees", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  adjustFee: async (studentFeeId: string, dto: { discount?: number; scholarshipAdjustment?: number; reason: string }) => {
    return apiClient<any>(`/fees/student-fees/${studentFeeId}/adjust`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  startPayment: async (studentFeeId: string, dto?: { gateway?: string; amount?: number }) => {
    return apiClient<any>(`/fees/${studentFeeId}/payments`, {
      method: "POST",
      body: JSON.stringify({
        gateway: dto?.gateway || "mock",
        amount: dto?.amount,
      }),
    });
  },

  recordManualPayment: async (studentFeeId: string, dto: { amount: number; mode: string; reference?: string }) => {
    return apiClient<any>(`/fees/${studentFeeId}/payments/manual`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getReceipt: async (paymentId: string) => {
    return apiClient<any>(`/fees/payments/${paymentId}/receipt`);
  },

  getReceiptAdmin: async (paymentId: string) => {
    return apiClient<any>(`/fees/payments/${paymentId}/receipt/admin`);
  },

  issueRefund: async (paymentId: string, dto: { amount: number; reason: string }) => {
    return apiClient<any>(`/fees/payments/${paymentId}/refunds`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

