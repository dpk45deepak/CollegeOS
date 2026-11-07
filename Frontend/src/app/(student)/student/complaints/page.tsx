"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { complaintsApi, ComplaintItem, ComplaintStatus } from "@/services/api/complaints.api";
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

  const isStaffOrAdmin = user?.role === "ADMIN" || user?.role === "HOD" || user?.role === "TEACHER";
  const [activeTab, setActiveTab] = useState<"student" | "queue">(isStaffOrAdmin ? "queue" : "student");

  // Student's personal complaints
  const { data: complaints, isLoading: isStudentLoading, error: studentError, refetch: refetchStudent } = useQuery({
    queryKey: ["student_complaints"],
    queryFn: () => studentApi.getComplaints(),
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
  const [category, setCategory] = useState<Complaint["category"]>("Infrastructure");
  const [priority, setPriority] = useState<Complaint["priority"]>("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

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
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("IN_PROGRESS");
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

  // Staff Action: Add Comment
  const [commentModalTicket, setCommentModalTicket] = useState<ComplaintItem | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  const addCommentMutation = useMutation({
    mutationFn: ({ id, note, internal }: { id: string; note: string; internal?: boolean }) =>
      complaintsApi.addComment(id, { note, internal }),
    onSuccess: () => {
      toast.success("Comment added to ticket record!");
      setCommentModalTicket(null);
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["staff_complaints_queue"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add comment");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createMutation.mutate({
      category,
      priority,
      subject,
      description,
      location,
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
          {isStaffOrAdmin && (
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
              <button
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

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Log Grievance
          </Button>
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
                <option value="SUBMITTED">Submitted (New)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
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
                            : ticket.status === "IN_PROGRESS"
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

                    {ticket.student && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border">
                        <span className="font-semibold text-foreground">Complainant:</span>
                        <span>
                          {ticket.student?.user?.firstName} {ticket.student?.user?.lastName} (Roll: {ticket.student?.rollNumber})
                        </span>
                      </div>
                    )}

                    {/* Staff Actions Toolbar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border flex-wrap">
                      <div className="text-[11px] text-muted-foreground">
                        {ticket.assignee ? (
                          <span>Assigned to: <strong className="text-foreground">{ticket.assignee.firstName} {ticket.assignee.lastName}</strong></span>
                        ) : (
                          <span className="text-amber-600 font-medium">Unassigned</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCommentModalTicket(ticket);
                            setCommentText("");
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Note
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setStatusModalTicket(ticket);
                            setNewStatus(ticket.status === "SUBMITTED" ? "IN_PROGRESS" : "RESOLVED");
                            setStatusNote("");
                          }}
                          className="text-xs h-7 gap-1"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Update Status
                        </Button>
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
      {(!isStaffOrAdmin || activeTab === "student") && (
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
              <option value="IN_PROGRESS">IN PROGRESS (Work Underway)</option>
              <option value="RESOLVED">RESOLVED (Corrective Action Complete)</option>
              <option value="REOPENED">REOPENED</option>
              <option value="CLOSED">CLOSED (Finalized)</option>
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
                <option value="Infrastructure">Infrastructure</option>
                <option value="Academic">Academic</option>
                <option value="Hostel">Hostel</option>
                <option value="Library">Library</option>
                <option value="Fee">Fee / Accounts</option>
                <option value="Ragging/Harassment">Ragging / Anti-Harassment</option>
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
                <option value="URGENT">Urgent (Immediate Safety)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Subject / Summary</label>
            <Input
              type="text"
              placeholder="e.g. Workstation monitor faulty in Lab 3B"
              value={subject}
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
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground block">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Describe the issue, frequency, and impact on academics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
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
        </form>
      </Dialog>
    </div>
  );
}
