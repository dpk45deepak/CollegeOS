"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { useAIStore } from "@/stores/useAIStore";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  BookOpen,
  Terminal,
  ShieldCheck,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AICopilotDrawer() {
  const { isCopilotOpen, setCopilotOpen } = useUIStore();
  const { messages, isStreaming, suggestedPrompts, sendMessage, resetConversation } =
    useAIStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!isCopilotOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleChipClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => setCopilotOpen(false)}
      />
      <div className="relative w-full max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-foreground">College Copilot</h3>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Online
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Grounding against verified syllabus & regulations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetConversation}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCopilotOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`flex gap-2.5 max-w-[90%] ${
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  )}
                </div>

                {/* Content Box */}
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user"
                        ? "bg-brand-600 text-white rounded-tr-none"
                        : "bg-card border border-border text-foreground rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Safety & Source Classification Tag */}
                  {msg.sender === "assistant" && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {msg.isOfficial && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Official College Record
                        </span>
                      )}
                      {msg.isRecommendation && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Lightbulb className="h-3 w-3 text-purple-600" />
                          AI Advisory Calculation
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tool Execution Card if present */}
                  {msg.toolExecution && (
                    <div className="rounded-xl border border-border bg-muted/40 p-2.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-muted-foreground pb-1 border-b border-border/50">
                        <Terminal className="h-3 w-3 text-brand-500" />
                        <span>Ran Tool: {msg.toolExecution.toolName}</span>
                      </div>
                      <div className="text-[10px] text-foreground font-sans mt-1">
                        {msg.toolExecution.summary}
                      </div>
                    </div>
                  )}

                  {/* Grounded Citation Chips */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        Verified Sources ({msg.citations.length})
                      </div>
                      <div className="space-y-1">
                        {msg.citations.map((cite, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-card border border-border text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <div className="font-semibold text-foreground truncate">
                              {cite.title} {cite.page ? `(p. ${cite.page})` : ""}
                            </div>
                            <div className="truncate text-muted-foreground">
                              {cite.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Action Chips */}
                  {msg.quickActions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.quickActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleChipClick(action.prompt)}
                          className="px-2 py-1 rounded-full text-[10px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100 transition-colors border border-brand-200 dark:border-brand-800"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isStreaming && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-3 w-3 text-brand-500 animate-spin" />
              </div>
              <span className="animate-pulse">Consulting university knowledge base & solving constraints...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts footer chips */}
        <div className="px-4 py-2 border-t border-border bg-muted/20">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Suggested Prompts
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {suggestedPrompts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(s.prompt)}
                disabled={isStreaming}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-card hover:bg-muted text-[11px] text-foreground border border-border transition-colors font-medium shrink-0 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask anything about attendance, exams, fees, or policy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              className="w-full rounded-xl border border-input bg-background pl-3.5 pr-12 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isStreaming}
              className="absolute right-1.5 h-7 w-7 rounded-lg p-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
