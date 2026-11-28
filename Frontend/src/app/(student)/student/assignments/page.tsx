"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { useAuthStore } from "@/lib/auth/authStore";
import { Assignment } from "@/types";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { storageApi } from "@/services/api/storage.api";
import { toast } from "sonner";

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ["student_assignments"],
    queryFn: () => studentApi.getAssignments(),
  });

  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "SUBMITTED" | "GRADED">("ALL");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (asgId: string) => {
      if (!selectedFile) {
        throw new Error("Please select an allowed file (PDF, PNG, JPG, DOCX, TXT) to submit.");
      }
      const uploadRes = await storageApi.uploadAttachment(selectedFile);
      const sizeStr = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      return studentApi.submitAssignment(asgId, {
        fileName: selectedFile.name,
        size: sizeStr,
        key: uploadRes.key,
      });
    },
    onSuccess: () => {
      setSubmissionSuccess(true);
      toast.success("Assignment submitted successfully!");
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmissionSuccess(false);
        setFileName("");
        setSelectedFile(null);
        queryClient.invalidateQueries({ queryKey: ["student_assignments"] });
      }, 1500);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit assignment. Please verify your attachment and retry.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !assignments) {
    return <ErrorState message="Could not load assignments." onRetry={refetch} />;
  }

  const filtered = (assignments || []).filter((asg) => {
    if (!asg) return false;
    if (activeTab === "ALL") return true;
    if (activeTab === "PENDING") return asg.status === "PENDING";
    if (activeTab === "SUBMITTED") return asg.status === "SUBMITTED" || asg.status === "LATE";
    if (activeTab === "GRADED") return asg.status === "GRADED";
    return true;
  });

  const handleOpenSubmit = (asg: Assignment) => {
    setSelectedAssignment(asg);
    setIsSubmitModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Course Assignments & Deliverables
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submit coursework, track grading rubrics, and view professor remarks.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
          {(["ALL", "PENDING", "SUBMITTED", "GRADED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "bg-background text-foreground shadow-xs"
                  : "hover:text-foreground"
              }`}
            >
              {(tab || "").charAt(0) + (tab || "").slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments in this category"
          description="Assignments matching the selected filter will appear here once published by your faculty."
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((asg) => {
          const isPending = asg.status === "PENDING";
          const isGraded = asg.status === "GRADED";

          return (
            <Card key={asg.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">
                      {asg.subjectCode} • {asg.subjectName}
                    </span>
                    <CardTitle className="text-sm font-bold text-foreground mt-1">
                      {asg.title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Assigned by {asg.teacherName}
                    </p>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" /> Due Soon
                      </span>
                    )}
                    {asg.status === "SUBMITTED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                        <FileCheck className="h-3 w-3" /> Submitted
                      </span>
                    )}
                    {asg.status === "LATE" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" /> Submitted Late
                      </span>
                    )}
                    {isGraded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Graded
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {asg.description}
                </p>

                {/* Attachments if any */}
                {asg.attachments && asg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {((asg.attachments || [])).map((file, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() =>
                          storageApi
                            .downloadFile(file.url || file.name, file.name)
                            .catch((err: any) => toast.error(err?.message || "Attachment download failed"))
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] text-foreground border border-border transition-colors"
                      >
                        <Download className="h-3 w-3 text-brand-500" />
                        <span className="truncate max-w-[140px]">{file.name}</span>
                        {file.size && <span className="text-[9px] opacity-70">({file.size})</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Graded Remarks if present */}
                {isGraded && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 dark:text-emerald-200">
                        Score: {asg.obtainedMarks} / {asg.totalMarks} Marks
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono">
                        {asg.totalMarks > 0 ? Math.round(((asg.obtainedMarks || 0) / asg.totalMarks) * 100) : 0}%
                      </span>
                    </div>
                    {asg.feedback && (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
                        &ldquo;{asg.feedback}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    Due: {formatDate(asg.dueDate)}
                  </div>

                  {(isPending || asg.status === "SUBMITTED" || asg.status === "LATE") && (
                    <Button
                      size="sm"
                      variant={asg.status === "SUBMITTED" || asg.status === "LATE" ? "outline" : "default"}
                      onClick={() => handleOpenSubmit(asg)}
                      className="text-xs gap-1.5 shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5" /> {asg.status === "SUBMITTED" || asg.status === "LATE" ? "Update Submission" : "Submit Work"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Submission Modal Dialog */}
      <Dialog
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedFile(null);
          setFileName("");
        }}
        title={selectedAssignment ? `Submit: ${selectedAssignment.title}` : "Submit Assignment"}
        description="Upload allowed document or image (PDF, PNG, JPG, DOCX, TXT up to 25 MB)"
      >
        <div className="space-y-4">
          {submissionSuccess ? (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-foreground">Submitted Successfully!</h4>
              <p className="text-xs text-muted-foreground">
                Your submission timestamp has been recorded.
              </p>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand-500 transition-colors bg-muted/20">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">
                  Click or drag files to upload
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  PDF, PNG, JPG, DOCX, TXT up to 25 MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      setFileName(f.name);
                    }
                  }}
                  className="mt-3 text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-brand-50 file:text-brand-700"
                />
              </div>

              {fileName && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-xs">
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                  <span className="font-semibold text-foreground truncate">{fileName}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSelectedFile(null);
                    setFileName("");
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedFile || submitMutation.isPending}
                  isLoading={submitMutation.isPending}
                  onClick={() => selectedAssignment && submitMutation.mutate(selectedAssignment.id)}
                  className="text-xs gap-1.5"
                >
                  Confirm & Submit
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
