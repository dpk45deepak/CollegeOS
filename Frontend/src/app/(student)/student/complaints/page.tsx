"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";

export default function StudentComplaintsPage() {
  const queryClient = useQueryClient();
  const { data: complaints, isLoading, error, refetch } = useQuery({
    queryKey: ["student_complaints"],
    queryFn: () => studentApi.getComplaints(),
  });

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
      queryClient.invalidateQueries({ queryKey: ["student_complaints"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !complaints) {
    return (
      <ErrorState
        message="Could not load grievances ledger. Please verify server connection."
        onRetry={refetch}
      />
    );
  }

  if (false) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

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
            Transparent ticket resolution with automated SLA tracking and escalation.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Log New Grievance
        </Button>
      </div>

      {/* Tickets List */}
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
                  {((item.timeline || [])).map((step, idx) => (
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

      {/* Log Grievance Modal Dialog */}
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
