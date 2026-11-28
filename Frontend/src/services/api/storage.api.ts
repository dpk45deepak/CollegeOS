import { apiClient, apiDownload, API_BASE_URL } from "@/lib/api/client";

export interface AttachmentUploadResult {
  key: string;
  mime: string;
  sizeBytes: number;
  originalName: string;
}

export const storageApi = {
  uploadAttachment: async (file: File): Promise<AttachmentUploadResult> => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient<AttachmentUploadResult>("/files/attachments", {
      method: "POST",
      body: formData,
    });
  },

  getDownloadUrl: (key: string): string => {
    return `${API_BASE_URL}/files/download?key=${encodeURIComponent(key)}`;
  },

  downloadFile: async (key: string, suggestedName?: string): Promise<void> => {
    await apiDownload(
      `/files/download?key=${encodeURIComponent(key)}`,
      suggestedName || key.split("/").pop() || "download"
    );
  },
};
