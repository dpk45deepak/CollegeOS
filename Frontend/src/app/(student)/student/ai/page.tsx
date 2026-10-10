"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIStore } from "@/stores/useAIStore";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  Lightbulb,
  Terminal,
  BookOpen,
  ArrowRight,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentAIPage() {
  const { messages, isStreaming, suggestedPrompts, sendMessage, resetConversation } =
    useAIStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              College AI Copilot
            </h1>
            <p className="text-xs text-muted-foreground">
              Grounded in official college ordinances, live attendance databases, and faculty registries.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetConversation}
          className="text-xs gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Chat
        </Button>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                )}
              </div>

              {/* Message Content Container */}
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white rounded-tr-none shadow-md"
                      : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Visual Distinction: Official Record vs AI Advisory */}
                {msg.sender === "assistant" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {msg.isOfficial && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Official College Information
                      </span>
                    )}
                    {msg.isRecommendation && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        <Lightbulb className="h-3.5 w-3.5 text-purple-600" />
                        AI Advisory Insight
                      </span>
                    )}
                  </div>
                )}

                {/* Tool Execution Card */}
                {msg.toolExecution && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-muted-foreground pb-1.5 border-b border-border/50">
                      <span className="flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400">
                        <Terminal className="h-3.5 w-3.5" />
                        Tool Invoked: {msg.toolExecution.toolName}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-sans">
                        Executed in 382ms
                      </span>
                    </div>

                    {/* Visual Attendance Card if attendance tool */}
                    {msg.toolExecution.data && (() => {
                      const toolData = msg.toolExecution.data as Record<string, unknown>;
                      const rawPercent = toolData.currentPercent ?? toolData.percentage;
                      const percent = typeof rawPercent === "number" ? rawPercent : Number(rawPercent) || 75;
                      const isDeficit = percent < 75;
                      return (
                        <div className="font-sans rounded-lg border border-border bg-card p-3 my-2 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <BarChart2 className="h-4 w-4 text-brand-600" />
                              Live Attendance Metrics
                            </span>
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${isDeficit ? "text-rose-600 bg-rose-50 dark:bg-rose-950" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950"}`}>
                              {isDeficit ? "Deficit Alert" : "Safe Standing"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-muted/50">
                              <span className="text-muted-foreground text-[10px] block">Current Attendance</span>
                              <span className="font-bold text-foreground text-sm">
                                {percent}%
                              </span>
                            </div>
                            <div className="p-2 rounded bg-muted/50">
                              <span className="text-muted-foreground text-[10px] block">Statutory Threshold</span>
                              <span className="font-bold text-emerald-600 text-sm">75.0% Required</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-[11px] font-sans text-muted-foreground">
                      {msg.toolExecution.summary}
                    </div>
                  </div>
                )}

                {/* Verified Source Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                      Official Grounded Sources ({msg.citations.length})
                    </div>
                    <div className="space-y-1.5">
                      {msg.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-muted/40 border border-border/70 text-xs"
                        >
                          <div className="font-semibold text-foreground">
                            {cite.title} {cite.page ? `• Page ${cite.page}` : ""}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {cite.source}
                          </div>
                          {cite.excerpt && (
                            <blockquote className="mt-1 pl-2 border-l-2 border-brand-500 text-[11px] italic text-muted-foreground">
                              &ldquo;{cite.excerpt}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Chips */}
                {msg.quickActions && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handlePromptClick(action.prompt)}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100 transition-colors border border-brand-200 dark:border-brand-800 flex items-center gap-1"
                      >
                        {action.label} <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-center gap-3 p-3 text-xs text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <span className="animate-pulse">
              Running constraint solvers and cross-referencing university policies...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Shelf */}
      <div className="shrink-0 pt-2 border-t border-border">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {suggestedPrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(s.prompt)}
              disabled={isStreaming}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-card hover:bg-muted text-xs text-foreground border border-border transition-colors font-medium shrink-0 disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center mt-2">
          <input
            type="text"
            placeholder="Ask anything: 'Why is my attendance low?', 'When is my next exam?', 'Find scholarships'..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            className="w-full rounded-2xl border border-input bg-card pl-4 pr-14 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 h-9 w-9 rounded-xl p-0 shadow-md shadow-brand-500/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
