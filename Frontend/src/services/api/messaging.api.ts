import { apiClient } from "@/lib/api/client";

export interface ConversationParticipant {
  userId: string;
  name?: string;
  user?: {
    id: string;
    loginId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { firstName: string; lastName: string };
}

export interface ConversationItem {
  id: string;
  type: "DIRECT" | "DEPARTMENT_ANNOUNCEMENT" | "AI_CHAT";
  title?: string | null;
  departmentId?: string | null;
  lastMessage?: DirectMessage | string | null;
  hasUnread?: boolean;
  updatedAt?: string;
  participants: ConversationParticipant[];
}

export const messagingApi = {
  startConversation: async (
    recipientUserId: string,
    message: string
  ): Promise<{ conversationId: string; message: DirectMessage }> => {
    return apiClient<{ conversationId: string; message: DirectMessage }>("/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientUserId, message }),
    });
  },

  listConversations: async (params?: { page?: number; limit?: number }): Promise<ConversationItem[]> => {
    const raw = await apiClient<any>("/messages/conversations", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getMessages: async (conversationId: string, params?: { page?: number; limit?: number }): Promise<DirectMessage[]> => {
    const raw = await apiClient<any>(`/messages/conversations/${conversationId}`, { params });
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  sendMessage: async (conversationId: string, content: string): Promise<DirectMessage> => {
    return apiClient<DirectMessage>(`/messages/conversations/${conversationId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  listRecipients: async (search?: string): Promise<Array<{ id: string; loginId: string; firstName: string; lastName: string; email: string; userRoles?: Array<{ role: { key: string }; departmentId?: string | null }> }>> => {
    return apiClient<any[]>("/messages/recipients", {
      params: search ? { search } : undefined,
    });
  },

  sendAnnouncement: async (dto: { departmentId: string; content: string; title?: string }) => {
    return apiClient<any>("/messages/announcements", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

