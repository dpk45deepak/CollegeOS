import { apiClient } from "@/lib/api/client";

export type DocumentType =
  | "REGULATION"
  | "ATTENDANCE_POLICY"
  | "EXAM_RULES"
  | "SCHOLARSHIP"
  | "FEE_POLICY"
  | "HOSTEL_RULES"
  | "PLACEMENT_POLICY"
  | "HANDBOOK"
  | "CIRCULAR"
  | "NOTICE"
  | "DEPARTMENT"
  | "SYLLABUS"
  | "TIMETABLE_POLICY"
  | "STUDENT_RECORD"
  | "OTHER";

export type DocumentVisibility =
  | "PUBLIC"
  | "STUDENTS"
  | "TEACHERS"
  | "STAFF"
  | "DEPARTMENT"
  | "ROLE_RESTRICTED"
  | "ADMIN_ONLY";

export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface DocumentItem {
  id: string;
  title: string;
  documentType: DocumentType;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  pageCount?: number;
  chunkCount?: number;
  mimeType?: string;
  fileSize?: number;
  storageKey?: string;
  createdAt: string;
  departmentId?: string | null;
  department?: { id: string; code: string; name: string };
  uploader?: { firstName: string; lastName: string };
}

export const documentsApi = {
  upload: async (file: File, metadata: {
    title: string;
    documentType: DocumentType;
    visibility?: DocumentVisibility;
    departmentId?: string;
    allowedRoleKeys?: string[];
    academicYear?: string;
    semesterNumber?: number;
    subjectId?: string;
  }): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", metadata.title);
    formData.append("documentType", metadata.documentType);
    if (metadata.visibility) formData.append("visibility", metadata.visibility);
    if (metadata.departmentId) formData.append("departmentId", metadata.departmentId);
    if (metadata.academicYear) formData.append("academicYear", metadata.academicYear);
    if (metadata.semesterNumber) formData.append("semesterNumber", String(metadata.semesterNumber));
    if (metadata.subjectId) formData.append("subjectId", metadata.subjectId);
    if (metadata.allowedRoleKeys) {
      metadata.allowedRoleKeys.forEach((k) => formData.append("allowedRoleKeys", k));
    }

    return apiClient<DocumentItem>("/documents", {
      method: "POST",
      body: formData,
    });
  },

  list: async (params?: {
    documentType?: DocumentType;
    status?: DocumentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DocumentItem[]> => {
    const raw = await apiClient<any>("/documents", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getById: async (id: string): Promise<DocumentItem> => {
    return apiClient<DocumentItem>(`/documents/${id}`);
  },

  getDownloadUrl: (id: string): string => {
    return `/api/v1/documents/${id}/download`;
  },

  updateVisibility: async (id: string, dto: {
    visibility: DocumentVisibility;
    departmentId?: string;
    allowedRoleKeys?: string[];
  }): Promise<DocumentItem> => {
    return apiClient<DocumentItem>(`/documents/${id}/visibility`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  reprocess: async (id: string) => {
    return apiClient<any>(`/documents/${id}/reprocess`, { method: "POST" });
  },

  delete: async (id: string): Promise<void> => {
    return apiClient<void>(`/documents/${id}`, { method: "DELETE" });
  },
};

