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
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface AIAdvisorData {
  collegeData: {
    attendance: { overall: number; minimum: number; flags?: any[] };
    upcomingExams: Array<{ subject?: string; title?: string; subjectId?: string; daysAway?: number; date?: string; scheduledAt?: string }>;
    pendingAssignments: Array<{ title: string; subject?: string; dueInDays?: number; dueAt?: string }>;
    overallExamAverage?: number;
    cgpa?: number | null;
    weakSubjects?: any[];
  };
  recommendations: Array<{
    area: string;
    suggestion: string;
    rationale: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  riskIndicator?: {
    level: "LOW" | "MEDIUM" | "HIGH";
    reasons: string[];
    confidence?: number;
  };
  narrative?: string;
  generatedBy?: string;
  disclaimer?: string;
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

  searchKnowledge: async (
    query: string,
    filters?: { documentType?: string; academicYear?: string; semesterNumber?: number }
  ) => {
    return apiClient<{ relevant: boolean; usedVector?: boolean; results?: any[] }>("/ai/knowledge/search", {
      method: "POST",
      body: JSON.stringify({ question: query, ...filters }),
    });
  },

  getObservabilityUsage: async (days?: number) => {
    return apiClient<any>("/ai/admin/usage", {
      params: days ? { days } : undefined,
    });
  },
};
