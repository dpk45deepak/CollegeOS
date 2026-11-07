import { apiClient } from "@/lib/api/client";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
  data?: Record<string, any>;
}

export const notificationsApi = {
  list: async (params?: { unread?: boolean; page?: number; limit?: number }): Promise<NotificationItem[]> => {
    const raw = await apiClient<any>("/notifications", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient<{ count: number }>("/notifications/unread-count");
  },

  markRead: async (ids?: string[]) => {
    return apiClient<{ count: number }>("/notifications/read", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  registerDevice: async (token: string, platform: "android" | "ios" | "web" = "web") => {
    return apiClient<void>("/notifications/devices", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    });
  },
};

