"use client";

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { complaintsApi } from "@/services/api/complaints.api";
import { messagesApi } from "@/lib/api/messages";
import { reportsApi } from "@/services/api/reports.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { AlertCircle, Download, Send } from "lucide-react";

const STATUSES = [
  "OPEN",
  "ASSIGNED",
  "INVESTIGATING",
  "RESOLVED",
  "AWAITING_FEEDBACK",
  "CLOSED",
  "ESCALATED",
  "REOPENED",
] as const;

export default function SupportDashboardPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [nextStatus, setNextStatus] = useState<string>("INVESTIGATING");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const { data: rawComplaints = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["support-complaints", statusFilter, priorityFilter],
    queryFn: () =>
      complaintsApi.getQueue({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 50,
      }),
  });

  const { data: staffRecipients = [] } = useQuery({
    queryKey: ["support-staff-recipients"],
    queryFn: () => messagesApi.getRecipients().catch(() => []),
  });

  const complaints = rawComplaints.filter((c: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.ticketNo || "").toLowerCase().includes(q) ||
      (c.subject || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  });

  const activeSummary = complaints.find((c: any) => c.id === selectedId) || complaints[0];

  const { data: activeDetail } = useQuery({
    queryKey: ["support-complaint-detail", activeSummary?.id],
    queryFn: () => complaintsApi.getById(activeSummary!.id),
    enabled: !!activeSummary?.id,
  });

  const active = activeDetail || activeSummary;

  useEffect(() => {
    if (!active?.status) return;
    if (active.status === "OPEN") setNextStatus("ASSIGNED");
    else if (active.status === "ASSIGNED" || active.status === "REOPENED") setNextStatus("INVESTIGATING");
    else if (active.status === "INVESTIGATING" || active.status === "ESCALATED") setNextStatus("RESOLVED");
    else setNextStatus("CLOSED");
  }, [active?.id, active?.status]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      complaintsApi.updateStatus(id, { status: status as any, note: "Updated by grievance support desk" }),
    onSuccess: () => {
      toast.success("Complaint status updated");
      qc.invalidateQueries({ queryKey: ["support-complaints"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update status"),
  });

  const assignTicket = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      complaintsApi.assign(id, { userId, note: "Assigned by support desk" }),
    onSuccess: () => {
      toast.success("Ticket assigned");
      qc.invalidateQueries({ queryKey: ["support-complaints"] });
      qc.invalidateQueries({ queryKey: ["support-complaint-detail", activeSummary?.id] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to assign ticket"),
  });

  const addComment = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      complaintsApi.addComment(id, { note, internal: isInternalNote }),
    onSuccess: () => {
      toast.success(isInternalNote ? "Internal note logged" : "Update posted to complainant");
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["support-complaints"] });
      qc.invalidateQueries({ queryKey: ["support-complaint-detail", activeSummary?.id] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to post update"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Grievance Desk Unavailable" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Support &amp; Grievance SLA Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Triage campus grievances, monitor SLA deadlines, and publish resolution updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search ticket # or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-52 h-9 text-xs"
          />
          <select
            aria-label="Filter complaint priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
          <select
            aria-label="Filter complaint status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs"
          >
            <option value="">All Ticket Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() =>
              reportsApi.downloadCsv("complaints").catch((err: any) =>
                toast.error(err?.message || "Failed to export complaints CSV"),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Active Queue ({complaints.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 max-h-[540px] overflow-y-auto">
            {complaints.map((c: any) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`rounded-xl border p-3 text-xs cursor-pointer ${
                  active?.id === c.id ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/30" : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold">{c.ticketNo}</span>
                  <div className="flex gap-1.5">
                    <Badge variant={c.priority === "CRITICAL" || c.priority === "HIGH" ? "destructive" : "secondary"}>
                      {c.priority}
                    </Badge>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                </div>
                <div className="font-semibold mt-1">{c.subject}</div>
                <div className="text-muted-foreground mt-0.5 line-clamp-2">{c.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Resolution Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {!active ? (
              <p className="text-muted-foreground py-8 text-center">No grievance tickets in queue.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{active.ticketNo}</span>
                    <Badge>{active.status}</Badge>
                  </div>
                  <h3 className="text-sm font-bold">{active.subject}</h3>
                  <p className="text-muted-foreground leading-relaxed">{active.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <select
                    aria-label="Assign handler"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="h-9 rounded-xl border border-border bg-background px-3 text-xs max-w-[200px]"
                  >
                    <option value="">
                      Assignee:{" "}
                      {active.assignedTo
                        ? `${active.assignedTo.firstName} ${active.assignedTo.lastName}`
                        : "Unassigned"}
                    </option>
                    {staffRecipients
                      .filter((r) => !(r.userRoles || []).some((ur) => ur.role?.key === "STUDENT" || ur.role?.key === "PARENT"))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.firstName} {r.lastName}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!assigneeId}
                    isLoading={assignTicket.isPending}
                    onClick={() => assignTicket.mutate({ id: active.id, userId: assigneeId })}
                  >
                    Assign
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => updateStatus.mutate({ id: active.id, status: nextStatus })}
                    isLoading={updateStatus.isPending}
                  >
                    Update Status
                  </Button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commentText.trim()) return;
                    addComment.mutate({ id: active.id, note: commentText.trim() });
                  }}
                  className="space-y-2"
                >
                  <div className="flex gap-2">
                    <Input
                      placeholder="Send resolution update or internal note..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button type="submit" size="sm" isLoading={addComment.isPending}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={isInternalNote} onChange={(e) => setIsInternalNote(e.target.checked)} />
                    Internal staff note (hidden from student)
                  </label>
                </form>

                {Array.isArray(active.events) && active.events.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase text-muted-foreground">Activity Timeline</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {active.events.map((ev: any) => (
                        <div key={ev.id} className="rounded-lg bg-muted/40 p-2 text-[11px]">
                          <div className="flex justify-between font-medium">
                            <span>{ev.type || ev.eventType || "EVENT"}</span>
                            <span className="text-muted-foreground">
                              {new Date(ev.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {ev.note && <p className="text-muted-foreground mt-0.5">{ev.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
