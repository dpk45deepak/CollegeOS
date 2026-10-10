import { apiClient } from "./client";

export interface MessageConversation {
  id: string;
  type: "DIRECT" | "ANNOUNCEMENT";
  name?: string;
  lastMessage?: string;
  updatedAt?: string;
  participants: Array<{
    user: {
      id: string;
      loginId: string;
      firstName: string;
      lastName: string;
    };
  }>;
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  }>;
}

export const messagesApi = {
  getConversations: async (): Promise<MessageConversation[]> => {
    const raw = await apiClient<any>("/messages/conversations");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items;
  },

  getMessages: async (conversationId: string) => {
    const raw = await apiClient<any>(`/messages/conversations/${conversationId}`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  sendMessage: async (conversationId: string, content: string) => {
    return apiClient<any>(`/messages/conversations/${conversationId}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  startConversation: async (recipientUserId: string, message: string) => {
    return apiClient<any>("/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientUserId, message }),
    });
  },
};
