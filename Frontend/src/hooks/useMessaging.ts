import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingApi } from "@/services/api/messaging.api";

export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: (params?: any) => [...messagingKeys.all, "conversations", params] as const,
  messages: (id: string) => [...messagingKeys.all, "messages", id] as const,
};

export function useConversations(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: messagingKeys.conversations(params),
    queryFn: () => messagingApi.listConversations(params),
  });
}

export function useMessages(conversationId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: messagingKeys.messages(conversationId),
    queryFn: () => messagingApi.getMessages(conversationId, params),
    enabled: !!conversationId,
    refetchInterval: 10000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      messagingApi.sendMessage(conversationId, content),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: messagingKeys.messages(vars.conversationId) });
      qc.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientUserId, message }: { recipientUserId: string; message: string }) =>
      messagingApi.startConversation(recipientUserId, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: messagingKeys.conversations() }),
  });
}

export function useSendAnnouncement() {
  return useMutation({
    mutationFn: messagingApi.sendAnnouncement,
  });
}

