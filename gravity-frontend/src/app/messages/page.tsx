"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  MessageSquare,
  Send,
  Search,
  User,
  ShieldCheck,
  CheckCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatThread {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: {
    id: string;
    sender: "me" | "them";
    text: string;
    time: string;
  }[];
}

const initialThreads: ChatThread[] = [
  {
    id: "th_1",
    name: "Dr. Vikram Sharma",
    role: "DBMS Professor (Course CS601)",
    avatar: "VS",
    lastMessage: "Please ensure your B+ tree implementation includes node redistribution logic.",
    timestamp: "11:20 AM",
    unread: false,
    messages: [
      { id: "m1", sender: "me", text: "Good morning Professor, for the B+ tree assignment, can we assume order 4 for the internal nodes?", time: "11:15 AM" },
      { id: "m2", sender: "them", text: "Yes Deepak, order 4 (max 3 keys per node) is the standard benchmark test suite.", time: "11:18 AM" },
      { id: "m3", sender: "them", text: "Please ensure your B+ tree implementation includes node redistribution logic.", time: "11:20 AM" },
    ],
  },
  {
    id: "th_2",
    name: "Placement Cell (Apex TPO)",
    role: "Official Corporate Announcements",
    avatar: "TPO",
    lastMessage: "TCS Prime registration portal closing at 11:59 PM tonight.",
    timestamp: "09:40 AM",
    unread: true,
    messages: [
      { id: "m4", sender: "them", text: "TCS Prime registration portal closing at 11:59 PM tonight.", time: "09:40 AM" },
    ],
  },
  {
    id: "th_3",
    name: "Prof. Ananya Iyer",
    role: "Operating Systems Instructor",
    avatar: "AI",
    lastMessage: "Lab 3B virtual machine images have been updated with Linux kernel 6.8.",
    timestamp: "Yesterday",
    unread: false,
    messages: [
      { id: "m5", sender: "them", text: "Lab 3B virtual machine images have been updated with Linux kernel 6.8.", time: "Yesterday" },
    ],
  },
];

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>("th_1");
  const [inputText, setInputText] = useState("");

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: "me" as const,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: inputText,
              timestamp: "Just now",
              messages: [...t.messages, newMessage],
            }
          : t
      )
    );

    setInputText("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Threads Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-card/60">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Messages</h2>
            <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
              Socket Active
            </span>
          </div>
          <Input placeholder="Search faculty or channels..." icon={<Search className="h-3.5 w-3.5" />} />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;

            return (
              <button
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                  isActive
                    ? "bg-brand-50/70 dark:bg-brand-950/40"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {thread.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {thread.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {thread.timestamp}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{thread.role}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-1">
                    {thread.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Conversation Body */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
              {activeThread.avatar}
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">{activeThread.name}</h3>
              <p className="text-[10px] text-muted-foreground">{activeThread.role}</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-semibold">
            Institutional Channel
          </span>
        </div>

        {/* Message Bubble History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeThread.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "me" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "me"
                    ? "bg-brand-600 text-white rounded-tr-none"
                    : "bg-card border border-border text-foreground rounded-tl-none shadow-xs"
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono mt-1 px-1">
                {msg.time}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={`Message ${activeThread.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-4 pr-12 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim()}
              className="absolute right-1.5 h-8 w-8 rounded-lg p-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
