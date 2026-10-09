"use client";

import React from "react";
import { useUIStore } from "@/stores/useUIStore";
import { Sparkles } from "lucide-react";

export function FloatingCopilotButton() {
  const { toggleCopilot } = useUIStore();

  return (
    <button
      onClick={toggleCopilot}
      className="fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all text-xs font-semibold group"
      aria-label="Open College AI Copilot"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
      </span>
      <Sparkles className="h-4 w-4 animate-spin-slow group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">Ask College AI</span>
    </button>
  );
}
