import { apiClient, apiDownload, API_BASE_URL } from "@/lib/api/client";

export type ReportType = "attendance" | "performance" | "fees" | "placements" | "complaints" | "scholarships";

export const reportsApi = {
  getDownloadUrl: (type: ReportType): string => {
    return `${API_BASE_URL}/reports/${type}`;
  },

  downloadCsv: async (type: ReportType, filename?: string): Promise<void> => {
    const suggestedName = filename || `${type}_report_${new Date().toISOString().split("T")[0]}.csv`;
    await apiDownload(`/reports/${type}`, suggestedName);
  },

  enqueueAsync: async (type: ReportType): Promise<{ jobId: string; status: "QUEUED" | "COMPLETED" }> => {
    return apiClient<{ jobId: string; status: "QUEUED" | "COMPLETED" }>(`/reports/${type}/async`, { method: "POST" });
  },

  downloadFileUrl: (key: string): string => {
    return `${API_BASE_URL}/reports/files/download?key=${encodeURIComponent(key)}`;
  },

  downloadFile: async (key: string, filename?: string): Promise<void> => {
    const suggestedName = filename || key.split("/").pop() || "report.csv";
    await apiDownload(`/reports/files/download?key=${encodeURIComponent(key)}`, suggestedName);
  },
};
