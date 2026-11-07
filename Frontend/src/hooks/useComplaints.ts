import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi, CreateComplaintDto, ComplaintStatus } from "@/services/api/complaints.api";

export const complaintKeys = {
  all: ["complaints"] as const,
  mine: (params?: any) => [...complaintKeys.all, "mine", params] as const,
  queue: (params?: any) => [...complaintKeys.all, "queue", params] as const,
  detail: (id: string) => [...complaintKeys.all, "detail", id] as const,
};

export function useMyComplaints(params?: { status?: string; category?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: complaintKeys.mine(params),
    queryFn: () => complaintsApi.getMyComplaints(params),
  });
}

export function useComplaintsQueue(params?: { status?: string; category?: string; priority?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: complaintKeys.queue(params),
    queryFn: () => complaintsApi.getQueue(params),
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: () => complaintsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateComplaintDto) => complaintsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: complaintKeys.all }),
  });
}

export function useRoutePreview() {
  return useMutation({
    mutationFn: (text: string) => complaintsApi.previewRoute(text),
  });
}

export function useUpdateComplaintStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ComplaintStatus; note?: string }) =>
      complaintsApi.updateStatus(id, { status, note }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: complaintKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}

export function useAssignComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, note }: { id: string; userId: string; note?: string }) =>
      complaintsApi.assign(id, { userId, note }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: complaintKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}

export function useAddComplaintComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note, internal }: { id: string; note: string; internal?: boolean }) =>
      complaintsApi.addComment(id, { note, internal }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: complaintKeys.detail(vars.id) }),
  });
}

export function useSubmitComplaintFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, comment, reopen }: { id: string; rating: number; comment?: string; reopen?: boolean }) =>
      complaintsApi.submitFeedback(id, { rating, comment, reopen }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: complaintKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: complaintKeys.all });
    },
  });
}

