import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "@/services/api/ai.api";

export const aiKeys = {
  all: ["ai"] as const,
  agents: () => [...aiKeys.all, "agents"] as const,
  conversations: (params?: any) => [...aiKeys.all, "conversations", params] as const,
  messages: (id: string) => [...aiKeys.all, "messages", id] as const,
  advisor: (studentId?: string) => [...aiKeys.all, "advisor", studentId] as const,
  observability: () => [...aiKeys.all, "observability"] as const,
};

export function useAIAgents() {
  return useQuery({
    queryKey: aiKeys.agents(),
    queryFn: () => aiApi.listAgents(),
  });
}

export function useAIConversations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: aiKeys.conversations(params),
    queryFn: () => aiApi.listConversations(params),
  });
}

export function useAIConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: aiKeys.messages(conversationId),
    queryFn: () => aiApi.getConversationMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useDeleteAIConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...aiKeys.all, "conversations"] }),
  });
}

export function useAIAdvisor(studentId?: string) {
  return useQuery({
    queryKey: aiKeys.advisor(studentId),
    queryFn: () => aiApi.getAdvisor(studentId),
  });
}

export function useConfirmGrievanceDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => aiApi.confirmGrievanceDraft(draftId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

export function useCancelGrievanceDraft() {
  return useMutation({
    mutationFn: (draftId: string) => aiApi.cancelGrievanceDraft(draftId),
  });
}

export function useAIObservability() {
  return useQuery({
    queryKey: aiKeys.observability(),
    queryFn: () => aiApi.getObservabilityUsage(),
  });
}

