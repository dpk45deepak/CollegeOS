"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth/authStore";
import { messagesApi, MessageConversation } from "@/lib/api/messages";
import {
  MessageSquare,
  Send,
  Search,
  User,
  ShieldCheck,
  CheckCheck,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(),
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [newFirstMessage, setNewFirstMessage] = useState("");

  const startConvMutation = useMutation({
    mutationFn: ({ recipientId, text }: { recipientId: string; text: string }) =>
      messagesApi.startConversation(recipientId, text),
    onSuccess: (data: any) => {
      setIsNewModalOpen(false);
      setNewRecipient("");
      setNewFirstMessage("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (data?.id) {
        setActiveThreadId(data.id);
      }
    },
  });

  const handleStartConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !newFirstMessage.trim()) return;
    startConvMutation.mutate({ recipientId: newRecipient, text: newFirstMessage });
  };

  const activeConv = conversations?.find((c) => c.id === activeThreadId) || conversations?.[0];

  const sendMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      messagesApi.sendMessage(convId, text),
    onSuccess: () => {
      setInputText("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    sendMutation.mutate({ convId: activeConv.id, text: inputText });
  };

  const filteredConversations = (conversations || []).filter((c) => {
    const otherUser = c.participants?.find((p) => p.user?.id !== user?.id)?.user;
    const name = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : c.name || "Conversation";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex rounded-2xl border border-border bg-card overflow-hidden">
        <div className="w-80 border-r border-border p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Threads Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-card/60">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Direct Messages</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
                Encrypted
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsNewModalOpen(true)}
                className="h-6 px-1.5 text-[10px] gap-1"
              >
                <Plus className="h-3 w-3" /> New
              </Button>
            </div>
          </div>
          <Input
            placeholder="Filter conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="font-semibold text-foreground">No conversations yet</p>
              <p className="text-[11px] leading-relaxed">
                Direct messages with course faculty and academic advisors will appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherUser = conv.participants?.find((p) => p.user?.id !== user?.id)?.user;
              const name = otherUser
                ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.loginId
                : conv.name || "Academic Channel";
              const initials = (name || "AC")
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "AC";
              const isActive = (activeConv?.id === conv.id) || (activeThreadId === conv.id);

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveThreadId(conv.id)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${
                    isActive
                      ? "bg-brand-50/70 dark:bg-brand-950/40"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="h-9 w-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {initials || "AC"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {name}
                      </span>
                      {conv.updatedAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {conv.lastMessage || "Click to open conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Body */}
      <div className="flex-1 flex flex-col bg-background">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center text-brand-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Institutional Messaging</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Private messaging is enabled between enrolled students and course faculty or department leadership.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                  {(() => {
                    const otherUser = activeConv.participants?.find((p) => p.user?.id !== user?.id)?.user;
                    const name = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : activeConv.name || "Channel";
                    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "AC";
                  })()}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">
                    {(() => {
                      const otherUser = activeConv.participants?.find((p) => p.user?.id !== user?.id)?.user;
                      return otherUser ? `${otherUser.firstName} ${otherUser.lastName}`.trim() : activeConv.name || "Academic Channel";
                    })()}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Institutional Communication</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-semibold">
                Verified Channel
              </span>
            </div>

            {/* Message Bubble History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(!activeConv.messages || activeConv.messages.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No message history yet. Send a message to initiate communication.
                </div>
              ) : (
                ((activeConv.messages || [])).map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? "bg-brand-600 text-white rounded-tr-none"
                            : "bg-card border border-border text-foreground rounded-tl-none shadow-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Type an institutional message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-4 pr-12 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="absolute right-1.5 h-8 w-8 rounded-lg p-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
      {/* Start Direct Conversation Dialog */}
      <Dialog
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Start Encrypted Conversation"
        description="Initiate an official message thread with course faculty or academic mentors."
      >
        <form onSubmit={handleStartConversation} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Recipient User ID or Login ID
            </label>
            <Input
              placeholder="e.g. FAC001, CSE23002, or HOD_CSE"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              required
            />
            <p className="text-[10px] text-muted-foreground">
              Direct messages are strictly restricted to enrolled course instructors, HODs, and ward mentors.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              First Message
            </label>
            <textarea
              rows={3}
              placeholder="Write your message here..."
              value={newFirstMessage}
              onChange={(e) => setNewFirstMessage(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={startConvMutation.isPending}>
              Send Message
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
