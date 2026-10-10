"use client";

import { create } from "zustand";
import { AIChatMessage } from "@/types";
import { aiApi, defaultSuggestedPrompts, AISuggestion } from "../lib/api/ai";

interface AIStore {
  messages: AIChatMessage[];
  isStreaming: boolean;
  suggestedPrompts: AISuggestion[];
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
}

const initialMessages: AIChatMessage[] = [
  {
    id: "init_1",
    sender: "assistant",
    content: `Hello! I am your **College OS Copilot**. 

I have live context on your **attendance metrics**, **syllabus progress**, **upcoming mid-term seatings**, and **verified scholarship matches**.

How can I help you excel today?`,
    timestamp: "Just now",
    isOfficial: true,
    isRecommendation: false,
    quickActions: [
      { label: "Why is my attendance low?", prompt: "Why is my attendance low in DBMS and how many classes do I need to attend?" },
      { label: "When is my next exam?", prompt: "When is my next exam and where is my seat allocated?" },
      { label: "Find scholarships", prompt: "Find scholarships for me" },
    ],
  },
];

export const useAIStore = create<AIStore>((set, get) => ({
  messages: initialMessages,
  isStreaming: false,
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
      const response = await aiApi.sendMessage(text, get().messages);
      set((state) => ({
        messages: [...state.messages, response],
        isStreaming: false,
      }));
    } catch {
      const errorMessage: AIChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        content: "I couldn't complete that query against the college database. Please try again or rephrase.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOfficial: false,
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isStreaming: false,
      }));
    }
  },

  resetConversation: () => {
    set({ messages: initialMessages, isStreaming: false });
  },
}));
