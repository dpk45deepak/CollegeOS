import { apiClient } from "@/lib/api/client";

export type ReportType = "attendance" | "performance" | "fees" | "placements" | "complaints" | "scholarships";

export const reportsApi = {
  getDownloadUrl: (type: ReportType): string => {
    return `/api/v1/reports/${type}`;
  },

  enqueueAsync: async (type: ReportType): Promise<{ success: boolean; message: string }> => {
    return apiClient<any>(`/reports/${type}/async`, { method: "POST" });
  },

  downloadFileUrl: (key: string): string => {
    return `/api/v1/reports/files/download?key=${encodeURIComponent(key)}`;
  },
};

