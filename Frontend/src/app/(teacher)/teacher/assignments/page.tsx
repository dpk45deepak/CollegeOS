"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApi } from "@/lib/api/teacher";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Upload,
  User,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherAssignmentsPage() {
  const { data: pendingAssignments, isLoading } = useQuery({
    queryKey: ["teacher_pending_assignments"],
    queryFn: () => teacherApi.getPendingAssignmentsToGrade(),
  });

  const { data: classes } = useQuery({
    queryKey: ["teacher_classes"],
    queryFn: () => teacherApi.getTodayClasses(),
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<{
    id: string;
    studentName: string;
    roll: string;
    title: string;
    submittedAt: string;
  } | null>(null);

  const [marks, setMarks] = useState("28");
  const [feedback, setFeedback] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(classes?.[0]?.subjectCode || "Course");
  const [deadline, setDeadline] = useState("");
  const [maxMarks, setMaxMarks] = useState("30");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const totalPending = pendingAssignments?.reduce((acc, a) => acc + (a.pendingCount || 0), 0) || 0;

  const createMutation = useMutation({
    mutationFn: (data: { subjectOfferingId: string; title: string; dueAt: string; maxMarks: number }) =>
      teacherApi.createAssignment(data),
    onSuccess: () => {
      setActionSuccess("Assignment published successfully to student portal!");
      setIsCreateOpen(false);
      setTitle("");
      setDeadline("");
      queryClient.invalidateQueries({ queryKey: ["teacher_pending_assignments"] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ subId, marks, feedback }: { subId: string; marks: number; feedback: string }) =>
      teacherApi.gradeSubmission(subId, { marks, feedback }),
    onSuccess: () => {
      setActionSuccess(`Evaluation saved for ${activeSubmission?.studentName || "student"}.`);
      setIsGradeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teacher_pending_assignments"] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
  });

  const handleGrade = (sub: {
    id: string;
    studentName: string;
    roll: string;
    title: string;
    submittedAt: string;
  }) => {
    setActiveSubmission(sub);
    setIsGradeOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    gradeMutation.mutate({
      subId: activeSubmission.id,
      marks: Number(marks) || 0,
      feedback,
    });
  };

  const handlePublishAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const offeringId = subject || classes?.[0]?.id;
    if (!offeringId || !title || !deadline) return;

    createMutation.mutate({
      subjectOfferingId: offeringId,
      title,
      dueAt: deadline,
      maxMarks: Number(maxMarks) || 30,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Course Deliverables & Evaluation Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create lab assignments, evaluate submissions, and publish rubric scores.
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

      {/* Submissions Queue Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-border">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Pending Evaluation Queue</span>
            <span className="text-xs font-normal text-muted-foreground">
              {totalPending} submission{totalPending === 1 ? "" : "s"} awaiting review
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
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
                {(!pendingAssignments || pendingAssignments.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                      No deliverables currently pending grading. All student submissions evaluated.
                    </td>
                  </tr>
                ) : (
                  pendingAssignments.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-foreground">{sub.subject}</div>
                      </td>
                      <td className="p-3 font-medium text-foreground">{sub.title}</td>
                      <td className="p-3 text-muted-foreground font-mono">{sub.pendingCount} students</td>
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
                          variant="outline"
                          onClick={() =>
                            handleGrade({
                              id: sub.id,
                              studentName: "Student",
                              roll: "Roster",
                              title: sub.title,
                              submittedAt: "Recent",
                            })
                          }
                          className="text-xs h-8"
                        >
                          Evaluate Batch
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create Assignment Modal Dialog */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Course Assignment"
        description="Configure rubric, upload question specs, and set submission deadline."
      >
        <form
          onSubmit={handlePublishAssignment}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Subject Offering</label>
              <select
                value={subject || classes?.[0]?.id || ""}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                required
              >
                {(classes || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectCode}: {c.subjectName} (Sec {c.section})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Max Marks</label>
              <Input
                type="number"
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
              onChange={(e) => setTitle(e.target.value)}
              required
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
            <input type="file" className="mt-2 text-[10px]" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={createMutation.isPending}>
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
          <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
            <span>Roll Number: <strong>{activeSubmission?.roll}</strong></span>
            <span className="text-brand-600 font-semibold cursor-pointer hover:underline">
              View Submitted PDF
            </span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Marks Awarded (out of 30)</label>
            <Input
              type="number"
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
            <Button variant="outline" size="sm" onClick={() => setIsGradeOpen(false)}>
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
