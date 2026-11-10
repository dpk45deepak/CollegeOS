import { apiClient } from "@/lib/api/client";

export type ComplaintCategory =
  | "ACADEMIC"
  | "FACULTY"
  | "INFRASTRUCTURE"
  | "HOSTEL"
  | "TRANSPORT"
  | "IT"
  | "FEES"
  | "SCHOLARSHIP"
  | "EXAMINATION"
  | "ATTENDANCE"
  | "OTHER"
  | "FACILITY"
  | "FINANCE"
  | "DISCIPLINE"
  | "HARASSMENT";

export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";

export type ComplaintStatus =
  | "OPEN"
  | "ASSIGNED"
  | "INVESTIGATING"
  | "RESOLVED"
  | "AWAITING_FEEDBACK"
  | "CLOSED"
  | "ESCALATED"
  | "REOPENED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "IN_PROGRESS";

export interface ComplaintItem {
  id: string;
  ticketNo?: string;
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  events?: Array<{
    id: string;
    eventType: string;
    note?: string;
    createdAt: string;
    actor?: { firstName: string; lastName: string };
  }>;
  feedbackRating?: number;
  feedbackComment?: string;
}

export interface RoutePreviewResult {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  desk: string;
  assigneeName?: string;
  slaHours: number;
}

export interface CreateComplaintDto {
  subject: string;
  description: string;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
}

export const complaintsApi = {
  create: async (dto: CreateComplaintDto): Promise<ComplaintItem> => {
    return apiClient<ComplaintItem>("/complaints", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  previewRoute: async (text: string): Promise<RoutePreviewResult> => {
    return apiClient<RoutePreviewResult>("/complaints/route-preview", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  getMyComplaints: async (params?: { status?: string; category?: string; page?: number; limit?: number }): Promise<ComplaintItem[]> => {
    const raw = await apiClient<any>("/complaints/my", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getQueue: async (params?: { status?: string; category?: string; priority?: string; page?: number; limit?: number }): Promise<ComplaintItem[]> => {
    const raw = await apiClient<any>("/complaints", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getById: async (id: string): Promise<ComplaintItem> => {
    return apiClient<ComplaintItem>(`/complaints/${id}`);
  },

  updateStatus: async (id: string, dto: { status: ComplaintStatus; note?: string }) => {
    return apiClient<ComplaintItem>(`/complaints/${id}/status`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  assign: async (id: string, dto: { userId: string; note?: string }) => {
    return apiClient<ComplaintItem>(`/complaints/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  addComment: async (id: string, dto: { note: string; internal?: boolean }) => {
    return apiClient<any>(`/complaints/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  submitFeedback: async (id: string, dto: { rating: number; comment?: string; reopen?: boolean }) => {
    return apiClient<any>(`/complaints/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

