"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAIStore } from "@/stores/useAIStore";
import { aiApi } from "@/lib/api/ai";
import { getPreferences } from "@/lib/preferences";
import { Dialog } from "@/components/ui/dialog";
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
  BarChart2,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  GraduationCap,
  Scale,
  Briefcase,
  DollarSign,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Map backend agent names to UI friendly labels and badges
function getAgentMeta(agentName?: string) {
  switch (agentName) {
    case "AttendanceAdvisorAgent":
      return {
        label: "Attendance Advisor",
        icon: BarChart2,
        color: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300",
      };
    case "AcademicAssistantAgent":
      return {
        label: "Academic Assistant",
        icon: GraduationCap,
        color: "text-indigo-600 dark:text-indigo-400",
        badgeBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-300",
      };
    case "ScholarshipAgent":
      return {
        label: "Scholarship Guide",
        icon: DollarSign,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300",
      };
    case "PlacementAgent":
      return {
        label: "Placement Advisor",
        icon: Briefcase,
        color: "text-amber-600 dark:text-amber-400",
        badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300",
      };
    case "GrievanceAgent":
    case "GrievanceDesk":
      return {
        label: "Grievance Desk",
        icon: Scale,
        color: "text-rose-600 dark:text-rose-400",
        badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300",
      };
    case "CollegeKnowledgeAgent":
      return {
        label: "University Bylaws",
        icon: BookOpen,
        color: "text-cyan-600 dark:text-cyan-400",
        badgeBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-300",
      };
    default:
      return {
        label: "Campus Intelligence",
        icon: Cpu,
        color: "text-brand-600 dark:text-brand-400",
        badgeBg: "bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-300",
      };
  }
}

// Lightweight Markdown Formatter
function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: "ul" | "ol" = "ul";

  const flushList = () => {
    if (currentList.length === 0) return;
    const items = currentList.map((item, idx) => (
      <li key={idx} className="leading-relaxed">
        {renderInlineMarkdown(item)}
      </li>
    ));
    if (listType === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 ml-4 list-disc space-y-1 text-sm text-foreground/90">
          {items}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 ml-4 list-decimal space-y-1 text-sm text-foreground/90">
          {items}
        </ol>
      );
    }
    currentList = [];
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // Empty line
    if (!line) {
      flushList();
      elements.push(<div key={`sp-${i}`} className="h-2" />);
      return;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="mt-3 mb-1 text-base font-bold text-foreground">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-1.5 text-lg font-bold text-foreground">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="mt-4 mb-2 text-xl font-extrabold text-foreground">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      );
      return;
    }

    // Bullet lists
    if (line.startsWith("* ") || line.startsWith("- ")) {
      if (currentList.length > 0 && listType !== "ul") flushList();
      listType = "ul";
      currentList.push(line.slice(2));
      return;
    }

    // Numbered lists
    const numMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (currentList.length > 0 && listType !== "ol") flushList();
      listType = "ol";
      currentList.push(numMatch[1]);
      return;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 border-l-2 border-brand-500 bg-muted/30 px-3 py-1.5 text-xs italic text-muted-foreground rounded-r"
        >
          {renderInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Standard paragraph line
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-foreground/90">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

// Render bold, inline code, and emphasis within a string
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-brand-600 dark:text-brand-400 font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-foreground/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export default function StudentAIPage() {
  const {
    messages,
    conversations,
    conversationId,
    isLoadingHistory,
    isStreaming,
    isConfirmingDraft,
    sendMessage,
    loadConversations,
    selectConversation,
    deleteConversation,
    resetConversation,
    confirmDraft,
    cancelDraft,
  } = useAIStore();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTrace, setExpandedTrace] = useState<Record<string, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorData, setAdvisorData] = useState<any | null>(null);
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);
  const [prefs, setPrefs] = useState(() => getPreferences());
  const [agents, setAgents] = useState<Array<{ name: string; description: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadConversations();
    aiApi.getAgents().then((list) => setAgents(Array.isArray(list) ? list : [])).catch(() => {});
    const syncPrefs = () => setPrefs(getPreferences());
    window.addEventListener("college_os_prefs_updated", syncPrefs);
    return () => window.removeEventListener("college_os_prefs_updated", syncPrefs);
  }, [loadConversations]);

  const handleOpenAdvisor = async () => {
    setIsAdvisorOpen(true);
    setLoadingAdvisor(true);
    try {
      const res = await aiApi.getAdvisor();
      setAdvisorData(res);
    } catch (err: any) {
      toast.error(err?.message || "Could not load academic advisor brief");
      setIsAdvisorOpen(false);
    } finally {
      setLoadingAdvisor(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTrace = (id: string) => {
    setExpandedTrace((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const agentPills = [
    { label: "Attendance Status", prompt: "What is my current attendance percentage and do I have any deficit below 75%?" },
    { label: "Exam Seating", prompt: "When is my next upcoming exam and what is my hall / seat allocation?" },
    { label: "Fee Dues", prompt: "Show my current fee balance and due date" },
    { label: "Leave Rules", prompt: "What is the official university policy regarding medical leave and condonation?" },
    { label: "Scholarships", prompt: "Which scholarships are currently open that match my CGPA and branch?" },
    { label: "Draft Grievance", prompt: "Help me draft an official grievance regarding broken computer lab equipment" },
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col gap-3">
      {/* Sleek Agent System Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-card border border-border/80 shadow-xs backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-brand-500/20">
            <Sparkles className="h-5 w-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-card"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-foreground">
                Campus Intelligence Copilot
              </h1>
              <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/20">
                Institutional AI
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Grounded in live university databases, faculty records, and academic bylaws
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {prefs.aiSuggestions && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenAdvisor}
              className="text-xs gap-1.5 rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Study Plan Advisor
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs gap-1.5 rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            History ({conversations.length})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetConversation}
            className="text-xs gap-1.5 rounded-xl border-border/80 hover:bg-muted/60 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            New Session
          </Button>
        </div>
      </div>

      {/* Specialist Agents Directory Strip */}
      {agents.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-brand-500" /> Specialist Agents:
          </span>
          {agents.map((ag) => (
            <span
              key={ag.name}
              title={ag.description}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-muted/40 text-foreground"
            >
              {ag.name.replace(/Agent$/, "")}
            </span>
          ))}
        </div>
      )}

      {/* Collapsible Saved Conversation History Bar */}
      {showHistory && (
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">Saved Copilot Conversations</span>
            <span className="text-[11px] text-muted-foreground">
              {isLoadingHistory ? "Loading..." : `${conversations.length} thread(s)`}
            </span>
          </div>
          {conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No saved conversations yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${
                    conversationId === conv.id
                      ? "border-brand-500 bg-brand-500/10 text-foreground font-semibold"
                      : "border-border bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectConversation(conv.id)}
                    className="hover:text-foreground truncate max-w-[180px]"
                  >
                    {conv.title || `Session ${new Date(conv.updatedAt).toLocaleDateString()}`}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={() => deleteConversation(conv.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const agentMeta = getAgentMeta(msg.agent);
          const AgentIcon = agentMeta.icon;
          const isTraceOpen = !!expandedTrace[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
                    isUser
                      ? "bg-brand-600 text-white"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  )}
                </div>

                {/* Message Bubble & Cards */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Agent Header Tag on Assistant Messages */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${agentMeta.badgeBg}`}>
                          <AgentIcon className="h-3 w-3" />
                          {agentMeta.label}
                        </span>

                        {msg.isOfficial && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="h-3 w-3" />
                            Verified Record
                          </span>
                        )}
                        {msg.isRecommendation && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                            <Lightbulb className="h-3 w-3" />
                            AI Advisory
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="h-2.5 w-2.5" />
                        {msg.timestamp}
                      </span>
                    </div>
                  )}

                  {/* Bubble Content */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 shadow-xs ${
                      isUser
                        ? "bg-brand-600 text-white rounded-tr-none text-sm leading-relaxed"
                        : "bg-card border border-border/80 text-foreground rounded-tl-none"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <MarkdownViewer content={msg.content} />
                    )}
                  </div>

                  {/* Verification Trace / Tool Execution Accordion */}
                  {!isUser && (msg.collegeData?.length || msg.toolExecution) && (
                    <div className="rounded-xl border border-border/70 bg-muted/30 overflow-hidden text-xs">
                      <button
                        onClick={() => toggleTrace(msg.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                          Database Verification & Tool Execution Trace
                          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                            {msg.collegeData?.length || 1} Queries Verified
                          </span>
                        </span>
                        {isTraceOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isTraceOpen && (
                        <div className="p-3 border-t border-border/60 space-y-2 bg-card/40">
                          {msg.collegeData?.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-muted/50 border border-border/50 space-y-1 font-mono text-[11px]"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  {item.ok ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                  )}
                                  {item.tool}()
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    item.ok
                                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                      : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                  }`}
                                >
                                  {item.ok ? "Query Succeeded" : "Tool Warning / Denied"}
                                </span>
                              </div>
                              <p className="font-sans text-xs text-muted-foreground">
                                {item.summary}
                              </p>
                            </div>
                          ))}

                          {!msg.collegeData?.length && msg.toolExecution && (
                            <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 space-y-1 font-mono text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  {msg.toolExecution.toolName}()
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  Verified
                                </span>
                              </div>
                              <p className="font-sans text-xs text-muted-foreground">
                                {msg.toolExecution.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grievance Draft Confirmation Card */}
                  {!isUser && msg.pendingDraftId && (
                    <div className="p-3.5 rounded-xl border-2 border-brand-500/40 bg-brand-500/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Scale className="h-4 w-4 text-brand-600" />
                          Official Grievance Draft Ready for Submission
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Pending Approval
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The AI assistant has composed this grievance based on your description. Per college safety policy, no official ticket is logged until you explicitly submit it.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          disabled={isConfirmingDraft}
                          isLoading={isConfirmingDraft}
                          onClick={() => confirmDraft(msg.pendingDraftId!)}
                          className="text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Confirm & Submit to Grievance Desk
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isConfirmingDraft}
                          onClick={() => cancelDraft(msg.pendingDraftId!)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Discard Draft
                        </Button>
                      </div>
                      {msg.disclaimer && (
                        <p className="text-[11px] text-muted-foreground italic">{msg.disclaimer}</p>
                      )}
                    </div>
                  )}

                  {/* Grounded Source Citations */}
                  {!isUser && prefs.citationVerbosity && msg.citations && msg.citations.length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                        Grounded College Documents ({msg.citations.length})
                      </div>
                      <div className="space-y-1.5">
                        {msg.citations.map((cite, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-muted/40 border border-border/60 text-xs"
                          >
                            <div className="font-semibold text-foreground flex items-center justify-between">
                              <span>{cite.title}</span>
                              {cite.page && (
                                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                  Page {cite.page}
                                </span>
                              )}
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

                  {/* Message Footer: Actions & Copy */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {/* Quick Action Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.quickActions?.map((action, i) => (
                          <button
                            key={i}
                            disabled={isStreaming}
                            onClick={() => {
                              sendMessage(action.prompt);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground transition-all border border-border/60 flex items-center gap-1 shadow-2xs hover:border-brand-500/40 disabled:opacity-50"
                          >
                            {action.label}
                            <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>

                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Thinking / Solvers State */}
        {isStreaming && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/70 max-w-[80%] shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white animate-pulse">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                Campus Intelligence Agent Active
                <span className="flex space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Executing student database queries and evaluating statutory requirements...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Quick Bar */}
      <div className="shrink-0 space-y-2 pt-1 border-t border-border/80">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {agentPills.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                sendMessage(p.prompt);
              }}
              disabled={isStreaming}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-card hover:bg-muted text-xs text-foreground/90 border border-border/80 hover:border-brand-500/40 transition-colors font-medium shrink-0 disabled:opacity-50 shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Modern Command Bar Input */}
        <div className="relative rounded-2xl border border-input bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Ask anything: 'What is my attendance percentage?', 'When is my next exam?', 'Check pending fees'..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
            <span className="text-[10px] text-muted-foreground hidden sm:inline-flex items-center gap-1 pl-2">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">↵ Enter</kbd>
              <span>to send,</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono">Shift + ↵</kbd>
              <span>for new line</span>
            </span>

            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isStreaming}
              className="ml-auto h-8 px-3 rounded-xl gap-1.5 bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Personal AI Academic Advisor Modal (GET /ai/advisor) */}
      <Dialog
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        title="Personal AI Academic Advisor"
        description="Deterministic risk check, upcoming deadlines, weak subjects, and prioritized study plan."
      >
        {loadingAdvisor ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Analyzing your academic records...</div>
        ) : !advisorData ? (
          <div className="py-6 text-center text-xs text-muted-foreground">Advisor brief unavailable.</div>
        ) : (
          <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div>
                <div className="font-semibold text-foreground">Academic Risk Indicator</div>
                <div className="text-[11px] text-muted-foreground">
                  Attendance: {advisorData.collegeData?.attendance?.overall ?? 0}% (Min {advisorData.collegeData?.attendance?.minimum ?? 75}%)
                </div>
              </div>
              <Badge
                variant={
                  advisorData.riskIndicator?.level === "HIGH"
                    ? "destructive"
                    : advisorData.riskIndicator?.level === "MEDIUM"
                    ? "secondary"
                    : "default"
                }
              >
                {advisorData.riskIndicator?.level || "LOW"} RISK
              </Badge>
            </div>

            {advisorData.narrative && (
              <div className="p-3 rounded-xl border border-brand-500/30 bg-brand-500/5 text-foreground leading-relaxed whitespace-pre-line">
                {advisorData.narrative}
              </div>
            )}

            {(advisorData.recommendations || []).length > 0 && (
              <div className="space-y-2">
                <div className="font-bold uppercase text-[10px] text-muted-foreground">Prioritized Action Plan</div>
                {advisorData.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-xl border border-border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{rec.subject || rec.title || "Action"}</span>
                      {rec.priority && <Badge variant="outline" className="text-[10px]">{rec.priority}</Badge>}
                    </div>
                    <p className="text-muted-foreground">{rec.action || rec.reason || rec.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {advisorData.disclaimer && (
              <p className="text-[10px] text-muted-foreground italic">{advisorData.disclaimer}</p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
