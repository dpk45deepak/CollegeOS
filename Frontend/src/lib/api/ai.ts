import { AIChatMessage } from "@/types";
import { apiClient, ApiError } from "./client";

export interface AISuggestion {
  label: string;
  prompt: string;
}

export const defaultSuggestedPrompts: AISuggestion[] = [
  { label: "Why is my attendance low?", prompt: "Why is my attendance low and how many classes do I need to attend?" },
  { label: "What is due this week?", prompt: "What assignments and deliverables are due this week?" },
  { label: "When is my next exam?", prompt: "When is my next exam and where is my seat allocated?" },
  { label: "Find scholarships for me", prompt: "Find scholarships matching my current CGPA and background." },
  { label: "Check pending fees", prompt: "What are my pending fee dues and when is the deadline?" },
  { label: "How to raise a grievance?", prompt: "How do I raise a grievance regarding lab equipment?" },
];

export interface BackendChatResponse {
  conversationId?: string;
  reply: string;
  agent?: string;
  mode?: "tool" | "rag" | "direct" | "llm" | "no_answer" | string;
  citations?: Array<{
    documentId: string;
    title: string;
    pageNumber?: number;
    snippet: string;
  }>;
  collegeData?: Array<{
    tool: string;
    ok: boolean;
    summary: string;
    data?: any;
  }>;
  pendingDraftId?: string;
  disclaimer?: string;
}

export const aiApi = {
  sendMessage: async (
    userMessage: string,
    historyOrConversationId?: AIChatMessage[] | string,
    conversationId?: string
  ): Promise<AIChatMessage> => {
    const actualConvId = typeof historyOrConversationId === "string" ? historyOrConversationId : conversationId;

    try {
      // Query NestJS Supervisor endpoint POST /api/v1/ai/chat
      const response = await apiClient<BackendChatResponse>(
        "/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({
            message: userMessage,
            conversationId: actualConvId,
          }),
        }
      );

      // Map backend response into AIChatMessage
      const hasCollegeData = (response.collegeData?.length ?? 0) > 0;
      const primaryTool = response.collegeData?.[0];

      return {
        id: `msg_${Date.now()}`,
        sender: "assistant",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOfficial: hasCollegeData || response.mode === "tool",
        isRecommendation: response.mode === "rag" || !hasCollegeData,
        agent: response.agent,
        mode: response.mode,
        disclaimer: response.disclaimer,
        pendingDraftId: response.pendingDraftId,
        collegeData: response.collegeData,
        citations: response.citations?.map((c) => ({
          title: c.title,
          source: `Doc ID: ${c.documentId}`,
          page: c.pageNumber,
          excerpt: c.snippet,
        })),
        toolExecution: primaryTool
          ? {
              toolName: primaryTool.tool,
              status: primaryTool.ok ? "completed" : "executing",
              summary: primaryTool.summary,
              data: primaryTool.data,
            }
          : undefined,
        quickActions: [
          { label: "View Attendance", prompt: "What is my current attendance percentage and shortfall?" },
          { label: "Upcoming Exams", prompt: "When is my next internal exam and where is my seat allocated?" },
          { label: "Check Fee Dues", prompt: "What are my pending fees and payment deadlines?" },
          { label: "Find Scholarships", prompt: "What scholarships match my academic profile?" },
        ],
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        503,
        "The AI Copilot service is currently unavailable. Please check backend AI configuration."
      );
    }
  },

  getAdvisor: async (studentId?: string) => {
    return apiClient<any>("/ai/advisor", {
      params: studentId ? { studentId } : undefined,
    });
  },

  confirmDraft: async (draftId: string) => {
    return apiClient<any>(`/ai/complaint-draft/${draftId}/confirm`, { method: "POST" });
  },

  cancelDraft: async (draftId: string) => {
    return apiClient<any>(`/ai/complaint-draft/${draftId}/cancel`, { method: "POST" });
  },

  getAgents: async () => {
    return apiClient<any[]>("/ai/agents");
  },

  askKnowledge: async (
    question: string,
    filters?: { documentType?: string; academicYear?: string }
  ): Promise<{
    answer: string;
    citations?: Array<{
      documentId: string;
      title: string;
      pageNumber?: number;
      snippet: string;
    }>;
  }> => {
    return apiClient<any>("/ai/knowledge/ask", {
      method: "POST",
      body: JSON.stringify({ question, ...filters }),
    });
  },
};