"use client";

import { create } from "zustand";
import { AIChatMessage } from "@/types";
import { aiApi, defaultSuggestedPrompts, AISuggestion, mapBackendChatResponse } from "../lib/api/ai";
import { streamAiChatOverSocket } from "../lib/socket/socketClient";
import { toast } from "sonner";

export interface AIConversationSummary {
  id: string;
  title?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AIStore {
  messages: AIChatMessage[];
  conversations: AIConversationSummary[];
  isLoadingHistory: boolean;
  isStreaming: boolean;
  isConfirmingDraft: boolean;
  conversationId?: string;
  selectedStudentId?: string;
  suggestedPrompts: AISuggestion[];
  setSelectedStudentId: (studentId?: string) => void;
  sendMessage: (text: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  resetConversation: () => void;
  resetStore: () => void;
  confirmDraft: (draftId: string) => Promise<void>;
  cancelDraft: (draftId: string) => Promise<void>;
}

const initialMessages: AIChatMessage[] = [
  {
    id: "init_1",
    sender: "assistant",
    agent: "CampusIntelligenceAgent",
    mode: "direct",
    content: `### Welcome to Campus Intelligence Copilot! 🎓

I am your personal AI Agent connected directly to **verified institutional databases**, **university ordinances**, and **live academic services**.

Here is what I can do for you right now:
* 📊 **Attendance Analytics:** Calculate your exact attendance percentage and verify minimum statutory requirements.
* 📝 **Exam Schedules & Seating:** Check upcoming mid-terms, final exams, room allocations, and deadlines.
* 💳 **Fee Dues & Receipts:** View current semester outstanding fees and payment deadlines.
* 🏆 **Scholarship Matching:** Identify government and institutional scholarships matched to your academic record.
* ⚖️ **Grievance Filing:** Prepare official grievance drafts that route straight to the grievance desk.

Choose a quick prompt below or type any question!`,
    timestamp: "Just now",
    isOfficial: true,
    isRecommendation: false,
    quickActions: [
      { label: "Check My Attendance", prompt: "What is my current attendance percentage and do I have any shortage?" },
      { label: "Upcoming Exams", prompt: "When is my next internal exam and where is it scheduled?" },
      { label: "Fee Dues Status", prompt: "What are my pending fee dues and when is the payment deadline?" },
      { label: "Eligible Scholarships", prompt: "What scholarships match my academic profile and CGPA?" },
    ],
  },
];

export const useAIStore = create<AIStore>((set, get) => ({
  messages: initialMessages,
  conversations: [],
  isLoadingHistory: false,
  isStreaming: false,
  isConfirmingDraft: false,
  conversationId: undefined,
  selectedStudentId: undefined,
  suggestedPrompts: defaultSuggestedPrompts,
  setSelectedStudentId: (studentId?: string) => set({ selectedStudentId: studentId }),

  loadConversations: async () => {
    set({ isLoadingHistory: true });
    try {
      const list = await aiApi.listConversations();
      set({ conversations: list });
    } catch {
      // Ignore quietly if unauthenticated or offline
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  selectConversation: async (id: string) => {
    set({ isLoadingHistory: true });
    try {
      const loaded = await aiApi.getConversationMessages(id);
      set({
        conversationId: id,
        messages: loaded.length > 0 ? loaded : initialMessages,
      });
    } catch (err: any) {
      toast.error(err?.message || "Could not load conversation history");
    } finally {
      set({ isLoadingHistory: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await aiApi.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        ...(state.conversationId === id ? { conversationId: undefined, messages: initialMessages } : {}),
      }));
      toast.success("Conversation deleted.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete conversation");
    }
  },

  sendMessage: async (text: string) => {
    if (!text.trim() || get().isStreaming) return;

    const userMessage: AIChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
    }));

    try {
      const streamPlaceholderId = `msg_stream_${Date.now()}`;
      let streamedCreated = false;
      const socketResponse = await streamAiChatOverSocket({
        message: text,
        conversationId: get().conversationId,
        studentId: get().selectedStudentId,
        onToken: (token) => {
          set((state) => {
            if (!streamedCreated) {
              streamedCreated = true;
              return {
                messages: [
                  ...state.messages,
                  {
                    id: streamPlaceholderId,
                    sender: "assistant",
                    content: token,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ],
              };
            }
            return {
              messages: state.messages.map((m) =>
                m.id === streamPlaceholderId ? { ...m, content: `${m.content}${token}` } : m
              ),
            };
          });
        },
      }).catch(() => null);

      const response = socketResponse
        ? mapBackendChatResponse(socketResponse)
        : await aiApi.sendMessage(text, get().conversationId, undefined, get().selectedStudentId);

      set((state) => ({
        messages: streamedCreated
          ? state.messages.map((m) => (m.id === streamPlaceholderId ? response : m))
          : [...state.messages, response],
        conversationId: response.conversationId ?? state.conversationId,
        isStreaming: false,
      }));
      get().loadConversations();
    } catch (err: any) {
      const errorText = err?.message || "I couldn't complete that query against the college database. Please try again or rephrase.";
      const errorMessage: AIChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        agent: "SystemDiagnostics",
        content: `**Notice:** ${errorText}\n\nYou can still query your verified attendance, pending fee dues, exams, or draft a grievance directly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOfficial: false,
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isStreaming: false,
      }));
    }
  },

  confirmDraft: async (draftId: string) => {
    if (get().isConfirmingDraft) return;
    set({ isConfirmingDraft: true });
    try {
      const result = await aiApi.confirmDraft(draftId);
      toast.success("Grievance ticket filed successfully!");
      set((state) => ({
        messages: [
          ...state.messages.map((m) =>
            m.pendingDraftId === draftId ? { ...m, pendingDraftId: undefined } : m
          ),
          {
            id: `draft_conf_${Date.now()}`,
            sender: "assistant",
            agent: "GrievanceDesk",
            content: `✅ **Grievance Ticket Created Successfully!**\n\nYour complaint has been submitted to the grievance desk with Ticket No: **${result.ticketNo || "Official Ticket"}**. You can track its live resolution progress in the Grievance portal.`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isOfficial: true,
          },
        ],
      }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm grievance draft");
    } finally {
      set({ isConfirmingDraft: false });
    }
  },

  cancelDraft: async (draftId: string) => {
    if (get().isConfirmingDraft) return;
    set({ isConfirmingDraft: true });
    try {
      await aiApi.cancelDraft(draftId);
      toast.info("Draft discarded");
      set((state) => ({
        messages: state.messages.map((m) =>
          m.pendingDraftId === draftId ? { ...m, pendingDraftId: undefined } : m
        ),
      }));
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel draft");
    } finally {
      set({ isConfirmingDraft: false });
    }
  },

  resetConversation: () => {
    set({ messages: initialMessages, isStreaming: false, isConfirmingDraft: false, conversationId: undefined });
    toast.info("AI Copilot conversation reset");
  },

  resetStore: () => {
    set({
      messages: initialMessages,
      conversations: [],
      isLoadingHistory: false,
      isStreaming: false,
      isConfirmingDraft: false,
      conversationId: undefined,
      selectedStudentId: undefined,
    });
  },
}));
