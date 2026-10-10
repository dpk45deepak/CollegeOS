"use client";

import React from "react";
import { useUIStore } from "@/stores/useUIStore";
import { Sparkles } from "lucide-react";

export function FloatingCopilotButton() {
  const { toggleCopilot } = useUIStore();

  return (
    <button
      onClick={toggleCopilot}
      className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full border-3 border-[var(--text)] bg-[var(--cta)] text-white shadow-[4px_4px_0_var(--text)] hover:shadow-[2px_2px_0_var(--text)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all text-xs font-bold font-display cursor-pointer group select-none"
      aria-label="Open College AI Copilot"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
      </span>
      <Sparkles className="h-4 w-4 animate-spin-slow group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline">Ask College AI</span>
    </button>
  );
}
