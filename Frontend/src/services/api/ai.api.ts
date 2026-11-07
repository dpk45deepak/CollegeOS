import { apiClient } from "@/lib/api/client";

export interface AICitation {
  documentId: string;
  title: string;
  pageNumber?: number;
  snippet: string;
}

export interface CollegeDataItem {
  tool: string;
  ok: boolean;
  summary: string;
  data?: any;
}

export interface ChatResponse {
  conversationId?: string;
  reply: string;
  agent?: string;
  mode?: "tool" | "rag" | "direct" | "llm" | "no_answer" | string;
  citations?: AICitation[];
  collegeData?: CollegeDataItem[];
  pendingDraftId?: string;
  disclaimer?: string;
}

export interface AIConversationItem {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface AIAdvisorData {
  studentId: string;
  collegeData: {
    attendance: { overallPct: number; threshold: number; shortage: boolean };
    upcomingExams: Array<{ title: string; scheduledAt: string }>;
    pendingAssignments: Array<{ title: string; dueAt: string }>;
    fees: { outstanding: number };
  };
  recommendations: Array<{
    area: string;
    suggestion: string;
    rationale: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  riskAssessment?: {
    level: "LOW" | "ELEVATED" | "CRITICAL";
    reasons: string[];
    confidence: number;
  };
}

export const aiApi = {
  chat: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    return apiClient<ChatResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversationId }),
    });
  },

  listAgents: async () => {
    return apiClient<any[]>("/ai/agents");
  },

  listConversations: async (params?: { page?: number; limit?: number }): Promise<AIConversationItem[]> => {
    const raw = await apiClient<any>("/ai/conversations", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getConversationMessages: async (id: string, params?: { page?: number; limit?: number }): Promise<ConversationMessage[]> => {
    const raw = await apiClient<any>(`/ai/conversations/${id}/messages`, { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  deleteConversation: async (id: string): Promise<void> => {
    return apiClient<void>(`/ai/conversations/${id}`, { method: "DELETE" });
  },

  getAdvisor: async (studentId?: string): Promise<AIAdvisorData> => {
    return apiClient<AIAdvisorData>("/ai/advisor", {
      params: studentId ? { studentId } : undefined,
    });
  },

  confirmGrievanceDraft: async (draftId: string) => {
    return apiClient<any>(`/ai/grievance/drafts/${draftId}/confirm`, {
      method: "POST",
    });
  },

  cancelGrievanceDraft: async (draftId: string) => {
    return apiClient<void>(`/ai/grievance/drafts/${draftId}`, {
      method: "DELETE",
    });
  },

  askKnowledge: async (question: string, filters?: { documentType?: string; academicYear?: string }) => {
    return apiClient<{ answer: string; citations?: AICitation[] }>("/ai/knowledge/ask", {
      method: "POST",
      body: JSON.stringify({ question, ...filters }),
    });
  },

  searchKnowledge: async (query: string, limit: number = 5) => {
    return apiClient<{ chunks: any[] }>("/ai/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  },

  getObservabilityUsage: async () => {
    return apiClient<any>("/ai/admin/usage");
  },
};
