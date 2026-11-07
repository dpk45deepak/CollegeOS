import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, DocumentType, DocumentStatus, DocumentVisibility } from "@/services/api/documents.api";

export const documentKeys = {
  all: ["documents"] as const,
  list: (params?: any) => [...documentKeys.all, "list", params] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
};

export function useDocuments(params?: {
  documentType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsApi.list(params),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: any }) => documentsApi.upload(file, metadata),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useUpdateDocumentVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { visibility: DocumentVisibility; departmentId?: string; allowedRoleKeys?: string[] } }) =>
      documentsApi.updateVisibility(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: documentKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: documentKeys.list() });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useReprocessDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.reprocess(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: documentKeys.detail(id) }),
  });
}

