import { apiClient } from "./client";

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId?: string;
  role?: string;
  content: string;
  metadata?: any;
  createdAt: string;
}

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
  messages?: MessageItem[];
}

export const messagesApi = {
  getConversations: async (): Promise<MessageConversation[]> => {
    const raw = await apiClient<any>("/messages/conversations");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items.map((cv: any) => {
      let preview = "Click to open conversation";
      if (typeof cv.lastMessage === "string") {
        preview = cv.lastMessage;
      } else if (cv.lastMessage && typeof cv.lastMessage === "object") {
        preview =
          typeof cv.lastMessage.content === "string"
            ? cv.lastMessage.content
            : "Click to open conversation";
      }
      const normalizedParticipants = (cv.participants || []).map((p: any) => {
        if (p?.user) return p;
        const fullName = String(p?.name || "").trim();
        const parts = fullName.split(/\s+/);
        return {
          ...p,
          user: {
            id: p?.userId || p?.id || "",
            loginId: p?.loginId || "",
            firstName: parts[0] || fullName || "Member",
            lastName: parts.slice(1).join(" "),
          },
        };
      });
      const firstParticipant = normalizedParticipants[0];
      const pUser = firstParticipant?.user || firstParticipant;
      const derivedName =
        cv.title ||
        cv.name ||
        (pUser
          ? pUser.name ||
            `${pUser.firstName || ""} ${pUser.lastName || ""}`.trim() ||
            pUser.loginId
          : undefined) ||
        "Direct Conversation";
      return {
        ...cv,
        participants: normalizedParticipants,
        name: derivedName,
        lastMessage: preview,
      };
    });
  },

  getRecipients: async (search?: string) => {
    return apiClient<
      Array<{
        id: string;
        loginId: string;
        firstName: string;
        lastName: string;
        email: string;
        userRoles?: Array<{ role: { key: string }; departmentId?: string | null }>;
      }>
    >("/messages/recipients", {
      params: search ? { search } : undefined,
    });
  },

  getMessages: async (conversationId: string): Promise<MessageItem[]> => {
    const raw = await apiClient<any>(`/messages/conversations/${conversationId}`);
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
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
