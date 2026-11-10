"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { campusApi, CreateNoticeDto } from "@/services/api/campus.api";
import { useDepartments } from "@/hooks/useAcademic";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  Bell,
  Download,
  FileText,
  AlertTriangle,
  Calendar,
  Building,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function NoticesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canPublish = user?.role === "ADMIN" || user?.role === "TEACHER" || user?.role === "HOD";

  const { data: notices, isLoading } = useQuery({
    queryKey: ["all_notices"],
    queryFn: () => studentApi.getNotices(),
  });

  const { data: departments } = useDepartments();

  const [filter, setFilter] = useState<"ALL" | "URGENT" | "HIGH">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [audienceRole, setAudienceRole] = useState("ALL");

  const createNoticeMutation = useMutation({
    mutationFn: async (dto: CreateNoticeDto) => {
      const created = await campusApi.createNotice(dto);
      // Auto-publish created notice
      if (created.id) {
        await campusApi.publishNotice(created.id);
      }
      return created;
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["all_notices"] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    createNoticeMutation.mutate({
      title,
      body,
      departmentId: departmentId || undefined,
      audienceRoles: audienceRole === "ALL" ? undefined : [audienceRole],
    });
  };

  if (isLoading || !notices) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const filtered = (notices || []).filter((n) => {
    if (!n) return false;
    if (filter === "ALL") return true;
    return n.priority === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Official Campus Notices & Bulletins
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified circulars from the Dean&apos;s Office, Examination Cell, and Student Affairs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canPublish && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="text-xs gap-1.5 h-8">
              <Plus className="h-4 w-4" /> Post Notice
            </Button>
          )}

          <div className="inline-flex h-8 items-center rounded-lg bg-muted p-1 text-muted-foreground">
            {(["ALL", "URGENT", "HIGH"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-md px-2.5 py-0.5 text-xs font-semibold transition-all ${
                  filter === tab
                    ? "bg-background text-foreground shadow-xs"
                    : "hover:text-foreground"
                }`}
              >
                {(tab || "").charAt(0) + (tab || "").slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((notice) => {
          const isUrgent = notice.priority === "URGENT";
          const isHigh = notice.priority === "HIGH";

          return (
            <Card
              key={notice.id}
              className={`hover:shadow-md transition-shadow ${
                isUrgent ? "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10" : ""
              }`}
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-brand-500" />
                      {typeof notice.department === "string" ? notice.department : (notice.department as any)?.code || (notice.department as any)?.name || "Campus Administration"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(notice.date)}
                  </span>
                </div>

                <CardTitle className="text-sm font-bold text-foreground mt-2">
                  {notice.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {notice.content}
                </p>

                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {((notice.attachments || [])).map((file, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (file.url) {
                            window.open(file.url, "_blank");
                          } else {
                            toast.info(`Official attachment ${file.name} is archived in the college registrar's repository.`);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-xs text-foreground font-medium transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                        <span>{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">({file.size})</span>
                        <Download className="h-3 w-3 text-muted-foreground ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Post Notice Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Official Campus Circular"
        description="Broadcast circular to student, faculty, and administrative portals."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Circular Title</label>
            <Input
              placeholder="e.g. Schedule for Mid-Term Practical Examinations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Audience Scope</label>
              <select
                value={audienceRole}
                onChange={(e) => setAudienceRole(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="ALL">Everyone (College-Wide)</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Department (Optional)</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">All Departments</option>
                {(departments || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Notice Content</label>
            <textarea
              rows={4}
              placeholder="Full text of circular or executive notification..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createNoticeMutation.isPending}>
              Publish Circular
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
