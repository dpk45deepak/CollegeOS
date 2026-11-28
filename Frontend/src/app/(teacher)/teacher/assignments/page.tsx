"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApi } from "@/lib/api/teacher";
import { attendanceApi } from "@/services/api/attendance.api";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Upload,
  Download,
  User,
  Sparkles,
  Search,
  ExternalLink,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { storageApi } from "@/services/api/storage.api";
import { toast } from "sonner";

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();

  const { data: pendingAssignments, isLoading, error, refetch } = useQuery({
    queryKey: ["teacher_pending_assignments"],
    queryFn: () => teacherApi.getPendingAssignmentsToGrade(),
  });

  const { data: teacherOfferings = [] } = useQuery({
    queryKey: ["teacher_offerings_all"],
    queryFn: () => attendanceApi.getTeacherOfferings({ limit: 100 }),
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [submissionTab, setSubmissionTab] = useState<"submitted" | "missing">("submitted");
  const [selectedAssignment, setSelectedAssignment] = useState<{
    id: string;
    title: string;
    subject: string;
    maxMarks?: number;
    attachmentKeys?: string[];
  } | null>(null);

  const {
    data: submissions,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["assignment_submissions", selectedAssignment?.id],
    queryFn: () =>
      selectedAssignment
        ? teacherApi.getAssignmentSubmissions(selectedAssignment.id)
        : Promise.resolve([]),
    enabled: !!selectedAssignment,
  });

  const { data: missingData, isLoading: missingLoading } = useQuery({
    queryKey: ["assignment_missing", selectedAssignment?.id],
    queryFn: () =>
      selectedAssignment
        ? teacherApi.getMissingSubmissions(selectedAssignment.id)
        : Promise.resolve({ pastDue: false, students: [] }),
    enabled: !!selectedAssignment,
  });

  const [activeSubmission, setActiveSubmission] = useState<{
    id: string;
    studentName: string;
    roll: string;
    title: string;
    submittedAt: string;
    submissionText?: string;
    fileKeys?: string[];
  } | null>(null);

  const [marks, setMarks] = useState("25");
  const [feedback, setFeedback] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("30");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const totalPending =
    pendingAssignments?.reduce((acc, a) => acc + (a.pendingCount || 0), 0) || 0;

  const createMutation = useMutation({
    mutationFn: (data: {
      subjectOfferingId: string;
      title: string;
      description?: string;
      dueAt: string;
      maxMarks: number;
      attachmentKeys?: string[];
    }) => teacherApi.createAssignment(data),
    onSuccess: () => {
      setActionSuccess("Assignment published successfully to student portal!");
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDeadline("");
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ["teacher_pending_assignments"] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create assignment");
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({
      subId,
      marks,
      feedback,
    }: {
      subId: string;
      marks: number;
      feedback: string;
    }) => teacherApi.gradeSubmission(subId, { marks, feedback }),
    onSuccess: () => {
      setActionSuccess(
        `Evaluation saved for ${activeSubmission?.studentName || "student"}.`
      );
      setIsGradeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teacher_pending_assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher_pending_grading"] });
      if (selectedAssignment) {
        queryClient.invalidateQueries({
          queryKey: ["assignment_submissions", selectedAssignment.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["assignment_missing", selectedAssignment.id],
        });
      }
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit grade");
    },
  });

  const handleOpenSubmissions = (a: {
    id: string;
    title: string;
    subject: string;
    maxMarks?: number;
    attachmentKeys?: string[];
  }) => {
    setSelectedAssignment(a);
    setSubmissionTab("submitted");
  };

  const handleGradeSubmission = (sub: any) => {
    const studentUser = sub.student?.user;
    const name = studentUser
      ? `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim()
      : sub.student?.name || "Student";
    const roll = sub.student?.rollNumber || "ID";

    setActiveSubmission({
      id: sub.id,
      studentName: name,
      roll,
      title: selectedAssignment?.title || "Assignment Submission",
      submittedAt: sub.submittedAt
        ? new Date(sub.submittedAt).toLocaleDateString()
        : "Submitted",
      submissionText: sub.text,
      fileKeys: Array.isArray(sub.fileKeys) ? sub.fileKeys : [],
    });
    setMarks(sub.marks != null ? String(sub.marks) : "0");
    setFeedback(sub.feedback || "Evaluated by course faculty.");
    setIsGradeOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    const numericMarks = Number(marks);
    const max = selectedAssignment?.maxMarks || 100;
    if (Number.isNaN(numericMarks) || numericMarks < 0 || numericMarks > max) {
      toast.error(`Marks must be between 0 and ${max}.`);
      return;
    }
    gradeMutation.mutate({
      subId: activeSubmission.id,
      marks: numericMarks,
      feedback,
    });
  };

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePublishAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading || createMutation.isPending) return;
    const offeringId = subject || teacherOfferings?.[0]?.id;
    if (!offeringId || !title.trim() || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (new Date(deadline) <= new Date()) {
      toast.error("Submission deadline must be in the future.");
      return;
    }

    let attachmentKeys: string[] | undefined;
    if (attachedFile) {
      setIsUploading(true);
      try {
        const uploadRes = await storageApi.uploadAttachment(attachedFile);
        attachmentKeys = [uploadRes.key];
      } catch (err) {
        toast.error("Failed to upload assignment attachment");
        return;
      } finally {
        setIsUploading(false);
      }
    }

    createMutation.mutate({
      subjectOfferingId: offeringId,
      title: title.trim(),
      description: description.trim() || undefined,
      dueAt: deadline,
      maxMarks: Math.max(1, Number(maxMarks) || 30),
      attachmentKeys,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Could not load deliverables evaluation queue."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Course Deliverables & Evaluation Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create lab assignments, evaluate student submissions, and record rubric scores.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create New Assignment
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Assignments Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Course Assignments</span>
            <span className="text-xs font-normal text-muted-foreground">
              {totalPending} total submission{totalPending === 1 ? "" : "s"} awaiting review
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-3 pl-4">Course</th>
                <th className="p-3">Deliverable Title</th>
                <th className="p-3">Pending Submissions</th>
                <th className="p-3">Status</th>
                <th className="p-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!pendingAssignments || pendingAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                    No deliverables found for your course offerings. Create a new assignment to begin.
                  </td>
                </tr>
              ) : (
                pendingAssignments.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4">
                      <div className="font-semibold text-foreground">{sub.subject}</div>
                    </td>
                    <td className="p-3 font-medium text-foreground">{sub.title}</td>
                    <td className="p-3 text-muted-foreground font-mono">
                      {sub.pendingCount} student{sub.pendingCount === 1 ? "" : "s"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          sub.pendingCount === 0
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {sub.pendingCount === 0 ? "Complete" : "Needs Review"}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <Button
                        size="sm"
                        variant={selectedAssignment?.id === sub.id ? "default" : "outline"}
                        onClick={() => handleOpenSubmissions(sub)}
                        className="text-xs h-8 gap-1"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {selectedAssignment?.id === sub.id ? "Viewing Roster" : "View Submissions"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Selected Assignment Submissions Drawer / Section */}
      {selectedAssignment && (
        <Card className="border-brand-200 dark:border-brand-900 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-brand-600" />
                <span>Deliverable Roster: {selectedAssignment.title}</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Course: {selectedAssignment.subject} • Download submitted files and record marks or inspect missing students.
              </p>
              {selectedAssignment.attachmentKeys && selectedAssignment.attachmentKeys.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedAssignment.attachmentKeys.map((k, idx) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        storageApi.downloadFile(k).catch((err: any) =>
                          toast.error(err?.message || "Failed to download question sheet"),
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] hover:bg-muted/80"
                    >
                      <Download className="h-3 w-3 text-brand-600" /> Spec File {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSubmissionTab("submitted")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    submissionTab === "submitted" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Submitted ({submissions?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionTab("missing")}
                  className={`px-2.5 py-1 rounded-md font-semibold ${
                    submissionTab === "missing" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Not Submitted ({missingData?.students?.length ?? 0})
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssignment(null)}
                className="text-xs h-7"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {submissionTab === "missing" ? (
              missingLoading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !missingData?.students?.length ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Every enrolled student has submitted this assignment.
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {missingData.pastDue && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" /> Deadline has passed — these students have missing submissions.
                    </div>
                  )}
                  <div className="divide-y divide-border border rounded-xl">
                    {missingData.students.map((st) => (
                      <div key={st.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="font-semibold">
                          {st.user ? `${st.user.firstName} ${st.user.lastName}` : "Student"}
                        </span>
                        <span className="font-mono text-muted-foreground">{st.rollNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : submissionsLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !submissions || submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No student submissions uploaded for this assignment yet.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Roll Number</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Submission Date</th>
                    <th className="p-3">Attachments</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Marks</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((sub: any) => {
                    const studentUser = sub.student?.user;
                    const studentName = studentUser
                      ? `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim()
                      : sub.student?.name || "Student";
                    const roll = sub.student?.rollNumber || "ID";
                    const isGraded = sub.status === "GRADED" || sub.marks != null;
                    const files: string[] = Array.isArray(sub.fileKeys) ? sub.fileKeys : [];

                    return (
                      <tr key={sub.id} className="hover:bg-muted/20">
                        <td className="p-3 pl-4 font-mono font-bold text-foreground">
                          {roll}
                        </td>
                        <td className="p-3 font-medium text-foreground">{studentName}</td>
                        <td className="p-3 text-muted-foreground">
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString()
                            : "Submitted"}
                        </td>
                        <td className="p-3">
                          {files.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {files.map((key, idx) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() =>
                                    storageApi.downloadFile(key).catch((err: any) =>
                                      toast.error(err?.message || "Failed to download file"),
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[11px] hover:bg-muted/80"
                                >
                                  <Download className="h-3 w-3 text-brand-600" /> File {idx + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isGraded
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : sub.status === "LATE"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            }`}
                          >
                            {sub.status || (isGraded ? "GRADED" : "SUBMITTED")}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold">
                          {sub.marks != null ? `${sub.marks}` : "—"}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <Button
                            size="sm"
                            variant={isGraded ? "outline" : "default"}
                            onClick={() => handleGradeSubmission(sub)}
                            className="text-xs h-7 px-2.5"
                          >
                            {isGraded ? "Update Grade" : "Grade"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Assignment Modal Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Course Assignment"
        description="Configure rubric, upload question specs, and set submission deadline."
      >
        <form onSubmit={handlePublishAssignment} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Subject Offering</label>
              <select
                value={subject || teacherOfferings?.[0]?.id || ""}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                required
              >
                {teacherOfferings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.subject?.code}: {o.subject?.name} (Sec {o.section?.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Max Marks</label>
              <Input
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Assignment Title</label>
            <Input
              placeholder="e.g. Relational Calculus & Complex Joins"
              value={title}
              maxLength={160}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Instructions / Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Provide submission guidelines or rubric notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Submission Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              required
            />
          </div>

          <div className="border border-dashed border-border rounded-lg p-4 text-center bg-muted/20">
            <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <span className="font-semibold text-foreground">Attach Problem Specification (PDF)</span>
            {attachedFile ? (
              <div className="text-xs text-brand-600 font-medium mt-1">{attachedFile.name}</div>
            ) : null}
            <input
              type="file"
              onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
              className="mt-2 text-[10px] block mx-auto"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={isUploading || createMutation.isPending} isLoading={isUploading || createMutation.isPending}>
              Publish to Students
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Grade Submission Modal Dialog */}
      <Dialog
        isOpen={isGradeOpen}
        onClose={() => setIsGradeOpen(false)}
        title={activeSubmission ? `Evaluate: ${activeSubmission.studentName}` : "Grade Submission"}
        description={activeSubmission?.title}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>Roll Number: <strong>{activeSubmission?.roll}</strong></span>
              <span className="text-muted-foreground">
                Submitted: {activeSubmission?.submittedAt}
              </span>
            </div>
            {activeSubmission?.submissionText && (
              <p className="text-[11px] text-muted-foreground italic mt-1 border-t border-border pt-1">
                &ldquo;{activeSubmission.submissionText}&rdquo;
              </p>
            )}
            {activeSubmission?.fileKeys && activeSubmission.fileKeys.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                {activeSubmission.fileKeys.map((key, idx) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      storageApi.downloadFile(key).catch((err: any) =>
                        toast.error(err?.message || "Failed to download submitted file"),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] hover:bg-muted"
                  >
                    <Download className="h-3 w-3 text-brand-600" /> Download File {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Marks Awarded (0 - {selectedAssignment?.maxMarks || 100})</label>
            <Input
              type="number"
              min={0}
              max={selectedAssignment?.maxMarks || 100}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Evaluation Remarks & Feedback</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsGradeOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={gradeMutation.isPending}>
              Save Grade & Notify Student
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
