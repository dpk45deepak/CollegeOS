import { apiClient } from "@/lib/api/client";

export interface AttachmentUploadResult {
  key: string;
  filename: string;
  mime: string;
  size: number;
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
};

