"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { complaintsApi, ComplaintItem, ComplaintStatus, RoutePreviewResult } from "@/services/api/complaints.api";
import { useAuthStore } from "@/lib/auth/authStore";
import { Complaint } from "@/types";
import {
  AlertCircle,
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Star,
  Send,
  Sparkles,
  ShieldAlert,
  UserCheck,
  Check,
  XCircle,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentComplaintsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const roleKeys = user?.roleKeys || [];
  const hasRole = (r: string) => user?.role === r || roleKeys.includes(r);
  const isStaffOrAdmin =
    hasRole("ADMIN") ||
    hasRole("COLLEGE_ADMIN") ||
    hasRole("SUPER_ADMIN") ||
    hasRole("HOD") ||
    hasRole("SUPPORT_STAFF") ||
    hasRole("ACCOUNTANT") ||
    hasRole("EXAM_CONTROLLER");
  const canViewOwnComplaints =
    hasRole("STUDENT") ||
    hasRole("PARENT") ||
    hasRole("ADMIN") ||
    hasRole("COLLEGE_ADMIN") ||
    hasRole("SUPER_ADMIN");
  const [activeTab, setActiveTab] = useState<"student" | "queue">(isStaffOrAdmin ? "queue" : "student");

  // Student's personal complaints
  const { data: complaints, isLoading: isStudentLoading, error: studentError, refetch: refetchStudent } = useQuery({
    queryKey: ["student_complaints"],
    queryFn: () => studentApi.getComplaints(),
    enabled: canViewOwnComplaints,
  });

  // Staff triage queue (all tickets routed to my department / admin)
  const [queueStatusFilter, setQueueStatusFilter] = useState("ALL");
  const { data: staffQueue, isLoading: isQueueLoading, error: queueError, refetch: refetchQueue } = useQuery({
    queryKey: ["staff_complaints_queue", queueStatusFilter],
    queryFn: async () => {
      const params = queueStatusFilter !== "ALL" ? { status: queueStatusFilter } : undefined;
      return complaintsApi.getQueue(params);
    },
    enabled: isStaffOrAdmin && activeTab === "queue",
  });

  // Log new grievance state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<Complaint["category"]>("INFRASTRUCTURE" as any);
  const [priority, setPriority] = useState<Complaint["priority"]>("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [routePreview, setRoutePreview] = useState<RoutePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreviewRoute = async () => {
    const text = `${subject} ${description}`.trim();
    if (text.length < 5) {
      toast.error("Enter a brief subject or description first to preview routing.");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await complaintsApi.previewRoute(text);
      setRoutePreview(res);
    } catch (err: any) {
      toast.error(err?.message || "Could not preview complaint route");
    } finally {
      setPreviewLoading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      category: Complaint["category"];
      priority: Complaint["priority"];
      subject: string;
      description: string;
      location?: string;
    }) => studentApi.createComplaint(data),
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setSubject("");
      setDescription("");
      setLocation("");
      toast.success("Grievance ticket submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["student_complaints"] });
      queryClient.invalidateQueries({ queryKey: ["staff_complaints_queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit ticket");
    },
  });

  // Staff Action: Update Status
  const [statusModalTicket, setStatusModalTicket] = useState<ComplaintItem | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("INVESTIGATING");
  const [statusNote, setStatusNote] = useState("");

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ComplaintStatus; note?: string }) =>
      complaintsApi.updateStatus(id, { status, note }),
    onSuccess: () => {
      toast.success("Ticket status updated successfully!");
      setStatusModalTicket(null);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["staff_complaints_queue"] });
      queryClient.invalidateQueries({ queryKey: ["student_complaints"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update ticket status");
    },
  });

  // Staff / Student Action: Add Comment
  const [commentModalTicket, setCommentModalTicket] = useState<{ id: string; isStudentReply?: boolean } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  const addCommentMutation = useMutation({
    mutationFn: ({ id, note, internal }: { id: string; note: string; internal?: boolean }) =>
      complaintsApi.addComment(id, { note, internal }),
    onSuccess: () => {
      toast.success("Comment added to ticket record!");
      setCommentModalTicket(null);
      setCommentText("");
      setIsInternalComment(false);
      queryClient.invalidateQueries({ queryKey: ["staff_complaints_queue"] });
      queryClient.invalidateQueries({ queryKey: ["student_complaints"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add comment");
    },
  });

  // Student Action: Submit Resolution Feedback / Reopen
  const [feedbackTicket, setFeedbackTicket] = useState<Complaint | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [reopenTicket, setReopenTicket] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: ({ id, rating, comment, reopen }: { id: string; rating: number; comment?: string; reopen?: boolean }) =>
      complaintsApi.submitFeedback(id, { rating, comment, reopen }),
    onSuccess: (_, vars) => {
      toast.success(vars.reopen ? "Ticket reopened and routed back for investigation." : "Feedback recorded. Thank you!");
      setFeedbackTicket(null);
      setFeedbackRating(5);
      setFeedbackComment("");
      setReopenTicket(false);
      queryClient.invalidateQueries({ queryKey: ["student_complaints"] });
      queryClient.invalidateQueries({ queryKey: ["staff_complaints_queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit resolution feedback");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description");
      return;
    }
    if (subject.trim().length < 5) {
      toast.error("Subject must be at least 5 characters long");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters long");
      return;
    }
    const mergedDescription = location.trim()
      ? `${description.trim()}\n\n[Location: ${location.trim()}]`
      : description.trim();
    createMutation.mutate({
      category,
      priority,
      subject: subject.trim(),
      description: mergedDescription,
      location: location.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Student Grievance & Helpdesk Triage
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent ticket resolution with automated SLA tracking, escalation, and departmental accountability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStaffOrAdmin && canViewOwnComplaints && (
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "queue"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Staff Triage Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("student")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "student"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Tickets
              </button>
            </div>
          )}

          {canViewOwnComplaints && (
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Log Grievance
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: STAFF RESOLUTION & SLA QUEUE */}
      {isStaffOrAdmin && activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Filter by SLA Status:</span>
              <select
                value={queueStatusFilter}
                onChange={(e) => setQueueStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
              >
                <option value="ALL">All Active Tickets</option>
                <option value="OPEN">Open (Submitted)</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="AWAITING_FEEDBACK">Awaiting Feedback</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated</option>
                <option value="REOPENED">Reopened</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground">
              Total Queue Items: <span className="font-semibold text-foreground">{staffQueue?.length || 0}</span>
            </div>
          </div>

          {isQueueLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : queueError ? (
            <ErrorState message="Could not load departmental grievance queue." onRetry={refetchQueue} />
          ) : !staffQueue || staffQueue.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card border-dashed">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-semibold text-foreground">Queue Clear — No Pending Tickets</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                All departmental student grievances have been triaged within their designated SLAs.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {staffQueue.map((ticket: any) => (
                <Card key={ticket.id} className="overflow-hidden border border-border">
                  <CardHeader className="p-4 pb-2 bg-muted/20 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                        {ticket.ticketNo || ticket.ticketNumber || `#${ticket.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-full">
                        {ticket.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          ticket.priority === "CRITICAL" || ticket.priority === "URGENT" || ticket.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Priority: {ticket.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                            : ticket.status === "INVESTIGATING" || ticket.status === "ASSIGNED"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                        }`}
                      >
                        {ticket.status?.replace("_", " ")}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{ticket.subject}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {(ticket.complainant || ticket.student) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                        <span className="font-semibold text-foreground">Complainant:</span>
                        <span>
                          {ticket.complainant
                            ? `${ticket.complainant.firstName} ${ticket.complainant.lastName}`
                            : `${ticket.student?.user?.firstName} ${ticket.student?.user?.lastName} (Roll: ${ticket.student?.rollNumber})`}
                        </span>
                      </div>
                    )}

                    {/* Staff Actions Toolbar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border flex-wrap">
                      <div className="text-[11px] text-muted-foreground">
                        {((ticket as any).assignedTo || ticket.assignee) ? (
                          <span>
                            Assigned to:{" "}
                            <strong className="text-foreground">
                              {((ticket as any).assignedTo || ticket.assignee).firstName}{" "}
                              {((ticket as any).assignedTo || ticket.assignee).lastName}
                            </strong>
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCommentModalTicket({ id: ticket.id, isStudentReply: false });
                            setCommentText("");
                            setIsInternalComment(false);
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Note
                        </Button>
                        {ticket.status !== "CLOSED" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              const validNext: Record<string, ComplaintStatus[]> = {
                                OPEN: ["ASSIGNED", "ESCALATED"],
                                ASSIGNED: ["INVESTIGATING", "RESOLVED", "ESCALATED"],
                                INVESTIGATING: ["AWAITING_FEEDBACK", "RESOLVED", "ESCALATED"],
                                AWAITING_FEEDBACK: ["RESOLVED", "REOPENED", "CLOSED"],
                                RESOLVED: ["CLOSED", "REOPENED"],
                                REOPENED: ["ASSIGNED", "INVESTIGATING", "RESOLVED"],
                                ESCALATED: ["ASSIGNED", "INVESTIGATING", "RESOLVED", "CLOSED"],
                                CLOSED: [],
                              };
                              const choices = validNext[ticket.status] || ["ASSIGNED"];
                              setStatusModalTicket(ticket);
                              setNewStatus(choices[0]);
                              setStatusNote("");
                            }}
                            className="text-xs h-7 gap-1"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Update Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: STUDENT'S PERSONAL GRIEVANCES */}
      {canViewOwnComplaints && (!isStaffOrAdmin || activeTab === "student") && (
        <div className="space-y-4">
          {isStudentLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : studentError || !complaints ? (
            <ErrorState
              message="Could not load grievances ledger. Please verify server connection."
              onRetry={refetchStudent}
            />
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl bg-card border-dashed">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-semibold text-foreground">No Grievances Filed</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                You do not have any active or previous grievance tickets on file.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="p-5 pb-3 bg-muted/20 border-b border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {item.ticketNumber}
                        </span>
                        <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Priority: {item.priority}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            item.status === "RESOLVED"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Updated {formatDate(item.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <CardTitle className="text-sm font-bold text-foreground mt-2">
                      {item.subject}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>

                    {item.location && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <MapPin className="h-3.5 w-3.5 text-brand-500" />
                        <span>Location: {item.location}</span>
                      </div>
                    )}

                    {/* Progress Timeline */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Resolution Timeline
                      </span>
                      <div className="space-y-2 border-l-2 border-brand-500/30 pl-3 ml-1">
                        {(item.timeline || []).map((step, idx) => (
                          <div key={idx} className="relative text-xs">
                            <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-brand-600" />
                            <div className="font-semibold text-foreground flex items-center justify-between">
                              <span>{step.title}</span>
                              <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                {step.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {step.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Student Feedback if resolved */}
                    {item.studentFeedback && (item.studentFeedback.rating || 0) > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-800 dark:text-emerald-200">
                            Student Rating:
                          </span>
                          <div className="flex text-amber-500">
                            {[...Array(Math.min(5, Math.max(1, item.studentFeedback?.rating || 5)))].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-muted-foreground text-[11px]">
                            &ldquo;{item.studentFeedback.comment}&rdquo;
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold">Verified Feedback</span>
                      </div>
                    )}

                    {/* Student Actions Toolbar */}
                    {item.status !== "CLOSED" && (
                      <div className="pt-2 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          Handler: <strong className="text-foreground">{item.assignedTo || "Campus Operations Committee"}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCommentModalTicket({ id: item.id, isStudentReply: true });
                              setCommentText("");
                              setIsInternalComment(false);
                            }}
                            className="text-xs h-7 gap-1"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Add Follow-up
                          </Button>
                          {(item.status === "RESOLVED" || (item.status as string) === "AWAITING_FEEDBACK") && !item.studentFeedback && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setFeedbackTicket(item);
                                setFeedbackRating(5);
                                setFeedbackComment("");
                                setReopenTicket(false);
                              }}
                              className="text-xs h-7 gap-1"
                            >
                              <Star className="h-3.5 w-3.5" /> Rate / Reopen
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Action Modal: Update Status */}
      <Dialog
        isOpen={!!statusModalTicket}
        onClose={() => setStatusModalTicket(null)}
        title={`Update Grievance Status: ${statusModalTicket?.ticketNo || statusModalTicket?.subject}`}
        description="Transition the ticket to a new resolution state with an official resolution note."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!statusModalTicket) return;
            updateStatusMutation.mutate({
              id: statusModalTicket.id,
              status: newStatus,
              note: statusNote.trim() || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Target Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              {(
                ({
                  OPEN: ["ASSIGNED", "ESCALATED"],
                  ASSIGNED: ["INVESTIGATING", "RESOLVED", "ESCALATED"],
                  INVESTIGATING: ["AWAITING_FEEDBACK", "RESOLVED", "ESCALATED"],
                  AWAITING_FEEDBACK: ["RESOLVED", "REOPENED", "CLOSED"],
                  RESOLVED: ["CLOSED", "REOPENED"],
                  REOPENED: ["ASSIGNED", "INVESTIGATING", "RESOLVED"],
                  ESCALATED: ["ASSIGNED", "INVESTIGATING", "RESOLVED", "CLOSED"],
                  CLOSED: [],
                } as Record<string, string[]>)[statusModalTicket?.status || "OPEN"] || ["ASSIGNED"]
              ).map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Resolution Note / Action Taken</label>
            <textarea
              rows={3}
              placeholder="e.g. Technician replaced workstation monitor; verified working with faculty."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalTicket(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateStatusMutation.isPending}
              isLoading={updateStatusMutation.isPending}
            >
              Save Status
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Staff Action Modal: Add Note */}
      <Dialog
        isOpen={!!commentModalTicket}
        onClose={() => setCommentModalTicket(null)}
        title="Add Ticket Note / Department Comment"
        description="Record progress details on this grievance ticket."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!commentModalTicket || !commentText.trim()) return;
            addCommentMutation.mutate({
              id: commentModalTicket.id,
              note: commentText.trim(),
              internal: isInternalComment,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Note / Observation</label>
            <textarea
              rows={3}
              placeholder="e.g. Parts ordered from vendor; expected arrival Monday morning."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {!commentModalTicket?.isStudentReply && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internalComment"
                checked={isInternalComment}
                onChange={(e) => setIsInternalComment(e.target.checked)}
                className="rounded border-input text-brand-600"
              />
              <label htmlFor="internalComment" className="text-xs text-muted-foreground cursor-pointer">
                Internal departmental note (hidden from student)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCommentModalTicket(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={addCommentMutation.isPending || !commentText.trim()}
              isLoading={addCommentMutation.isPending}
            >
              Add Note
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Log Grievance Modal Dialog (Student / Staff) */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New College Grievance / Ticket"
        description="Your grievance will be automatically triaged to the responsible department head."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Complaint["category"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="INFRASTRUCTURE">Infrastructure & Campus Facilities</option>
                <option value="ACADEMIC">Academic & Curriculum</option>
                <option value="FACULTY">Faculty & Instruction</option>
                <option value="HOSTEL">Hostel & Accommodation</option>
                <option value="FEES">Fees & Financial Accounts</option>
                <option value="EXAMINATION">Examinations & Seating</option>
                <option value="ATTENDANCE">Attendance & Debarment Dispute</option>
                <option value="IT">IT & Lab Systems</option>
                <option value="TRANSPORT">Campus Transport</option>
                <option value="OTHER">Other / General Grievance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Complaint["priority"])}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical (Immediate Safety)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Subject / Summary</label>
            <Input
              type="text"
              placeholder="e.g. Workstation monitor faulty in Lab 3B"
              value={subject}
              maxLength={160}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Location Details</label>
            <Input
              type="text"
              placeholder="e.g. Block C, 3rd Floor, Station 14"
              value={location}
              maxLength={120}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Describe the issue, frequency, and impact on academics..."
              value={description}
              maxLength={5000}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {routePreview && (
            <div className="p-2.5 rounded-xl border border-brand-500/30 bg-brand-500/5 text-[11px] space-y-1">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>Detected Desk: {routePreview.handlerRole} ({routePreview.category})</span>
                <span className="font-mono text-[10px] text-brand-600">{routePreview.priority}</span>
              </div>
              <div className="text-muted-foreground">{routePreview.rationale}</div>
              {routePreview.assignee && (
                <div className="text-foreground">Handler: <strong>{routePreview.assignee.name}</strong></div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePreviewRoute}
              isLoading={previewLoading}
              className="text-xs gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Preview Routing
            </Button>
            <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateModalOpen(false);
                setRoutePreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Submit Ticket
            </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Student Feedback / Reopen Modal */}
      <Dialog
        isOpen={!!feedbackTicket}
        onClose={() => setFeedbackTicket(null)}
        title={`Resolution Feedback: ${feedbackTicket?.ticketNumber || feedbackTicket?.subject}`}
        description="Rate how satisfactorily your grievance was resolved, or request reopening if unresolved."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!feedbackTicket) return;
            feedbackMutation.mutate({
              id: feedbackTicket.id,
              rating: feedbackRating,
              comment: feedbackComment.trim() || undefined,
              reopen: reopenTicket,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="font-medium text-foreground block mb-1.5">Satisfaction Rating (1–5)</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    feedbackRating >= star
                      ? "bg-amber-50 border-amber-300 text-amber-500 dark:bg-amber-950/40"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Star className={`h-4 w-4 ${feedbackRating >= star ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-medium text-foreground block mb-1">Comments (Optional)</label>
            <textarea
              rows={3}
              placeholder="Share details on resolution quality or why this ticket needs further work..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reopenTicket"
              checked={reopenTicket}
              onChange={(e) => setReopenTicket(e.target.checked)}
              className="rounded border-input text-brand-600"
            />
            <label htmlFor="reopenTicket" className="text-xs text-foreground cursor-pointer font-medium">
              Issue is still unresolved — reopen ticket for further action
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setFeedbackTicket(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={feedbackMutation.isPending}>
              {reopenTicket ? "Reopen Ticket" : "Submit Feedback & Close"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
