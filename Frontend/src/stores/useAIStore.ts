"use client";

import { create } from "zustand";
import { AIChatMessage } from "@/types";
import { aiApi, defaultSuggestedPrompts, AISuggestion } from "../lib/api/ai";
import { toast } from "sonner";

interface AIStore {
  messages: AIChatMessage[];
  isStreaming: boolean;
  conversationId?: string;
  suggestedPrompts: AISuggestion[];
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
  confirmDraft: (draftId: string) => Promise<void>;
  cancelDraft: (draftId: string) => Promise<void>;
}

const initialMessages: AIChatMessage[] = [
  {
    id: "init_1",
    sender: "assistant",
    agent: "CampusIntelligenceAgent",
    mode: "direct",
    content: `### Welcome to SDIET Campus Intelligence Copilot! 🎓

I am your personal AI Agent connected directly to **verified student databases**, **university ordinances**, and **live academic services**.

Here is what I can do for you right now:
* 📊 **Attendance Analytics:** Calculate your exact attendance percentage and verify minimum statutory 75% requirements.
* 📝 **Exam Schedules & Seating:** Check upcoming mid-terms, final exams, seat allocations, and syllabus milestones.
* 💳 **Fee Dues & Receipts:** View current semester outstanding fees and payment deadlines.
* 🏆 **Scholarship Matching:** Identify government and institutional scholarships matched to your academic record.
* ⚖️ **Grievance Filing:** Prepare official grievance drafts that route straight to the grievance desk.

Choose a quick prompt below or type any question!`,
    timestamp: "Just now",
    isOfficial: true,
    isRecommendation: false,
    quickActions: [
      { label: "Check My Attendance", prompt: "What is my current attendance percentage and do I have any shortage?" },
      { label: "Upcoming Exams", prompt: "When is my next internal exam and where is my seat allocated?" },
      { label: "Fee Dues Status", prompt: "What are my pending fee dues and when is the payment deadline?" },
      { label: "Eligible Scholarships", prompt: "What scholarships match my academic profile and CGPA?" },
    ],
  },
];

export const useAIStore = create<AIStore>((set, get) => ({
  messages: initialMessages,
  isStreaming: false,
  conversationId: undefined,
  suggestedPrompts: defaultSuggestedPrompts,

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
      const response = await aiApi.sendMessage(text, get().conversationId);
      set((state) => ({
        messages: [...state.messages, response],
        isStreaming: false,
      }));
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
    try {
      const result = await aiApi.confirmDraft(draftId);
      toast.success("Grievance ticket filed successfully!");
      set((state) => ({
        messages: [
          ...state.messages,
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
    }
  },

  cancelDraft: async (draftId: string) => {
    try {
      await aiApi.cancelDraft(draftId);
      toast.info("Draft discarded");
      set((state) => ({
        messages: state.messages.map((m) =>
          m.pendingDraftId === draftId ? { ...m, pendingDraftId: undefined } : m
        ),
      }));
    } catch {
      toast.error("Failed to cancel draft");
    }
  },

  resetConversation: () => {
    set({ messages: initialMessages, isStreaming: false, conversationId: undefined });
    toast.info("AI Copilot conversation reset");
  },
}));
