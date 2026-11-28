"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApi, TeacherAtRiskStudent } from "@/lib/api/teacher";
import { timetableApi, minutesToTimeString } from "@/services/api/timetable.api";
import { examsApi, ExamItem, ExamResultItem } from "@/services/api/exams.api";
import {
  CalendarCheck2,
  Users,
  FileCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  CalendarDays,
  Plane,
  Award,
  Edit3,
  Send,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ["teacher_classes"],
    queryFn: () => teacherApi.getTodayClasses(),
  });

  const { data: atRiskStudents, isLoading: riskLoading } = useQuery({
    queryKey: ["teacher_at_risk"],
    queryFn: () => teacherApi.getAtRiskStudents(),
  });

  const { data: pendingGrading } = useQuery({
    queryKey: ["teacher_pending_grading"],
    queryFn: () => teacherApi.getPendingAssignmentsToGrade(),
  });

  // Scheduled / Conducted Exams
  const { data: exams, isLoading: examsLoading, refetch: refetchExams } = useQuery({
    queryKey: ["teacher_exams"],
    queryFn: () => examsApi.list(),
  });

  const { data: weeklySlots = [] } = useQuery({
    queryKey: ["teacher_weekly_timetable"],
    queryFn: () => timetableApi.getMyTeacherTimetable().catch(() => []),
  });

  const { data: myLeaves = [] } = useQuery({
    queryKey: ["teacher_my_leaves"],
    queryFn: () => teacherApi.getMyLeaves().catch(() => []),
  });

  const facultyLastName = user?.name ? user.name.split(" ").slice(-1)[0] : "Faculty";
  const classCount = classes?.length || 0;
  const atRiskCount = atRiskStudents?.length || 0;
  const pendingGradingCount = pendingGrading?.reduce((a: number, b: { pendingCount?: number }) => a + (b.pendingCount || 0), 0) || 0;

  // Leave application state
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [leaveTo, setLeaveTo] = useState(new Date().toISOString().split("T")[0]);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  const leaveMutation = useMutation({
    mutationFn: (data: { fromDate: string; toDate: string; reason: string }) =>
      teacherApi.requestLeave(data),
    onSuccess: () => {
      setLeaveSuccess("Leave application submitted to Department Head.");
      setIsLeaveOpen(false);
      setLeaveReason("");
      queryClient.invalidateQueries({ queryKey: ["teacher_my_leaves"] });
      setTimeout(() => setLeaveSuccess(null), 4000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit leave application. Please check dates.");
    },
  });

  // Marks Entry State
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [marksSheet, setMarksSheet] = useState<Array<{ studentId: string; rollNumber: string; studentName: string; marksObtained: number }>>([]);
  const [marksReason, setMarksReason] = useState("");

  const { data: fetchedMarksData, isLoading: resultsLoading } = useQuery({
    queryKey: ["exam_results", selectedExam?.id],
    queryFn: async () => {
      if (!selectedExam) return { rows: [] as typeof marksSheet, hasPublished: false };
      const res = await examsApi.getResults(selectedExam.id);
      if (Array.isArray(res) && res.length > 0) {
        return {
          hasPublished: res.some((r) => r.status === "PUBLISHED"),
          rows: res.map((r) => ({
            studentId: r.studentId,
            rollNumber: r.student?.rollNumber || "ID",
            studentName: r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}` : "Student",
            marksObtained: r.marksObtained ?? 0,
          })),
        };
      }
      if (selectedExam.subjectOfferingId) {
        try {
          const roster = await teacherApi.getClassRoster(selectedExam.subjectOfferingId);
          return {
            hasPublished: false,
            rows: Array.isArray(roster)
              ? roster.map((s) => ({
                  studentId: s.id,
                  rollNumber: s.rollNumber || "ID",
                  studentName: s.name || "Student",
                  marksObtained: 0,
                }))
              : [],
          };
        } catch {
          return { rows: [], hasPublished: false };
        }
      }
      return { rows: [], hasPublished: false };
    },
    enabled: !!selectedExam,
  });

  React.useEffect(() => {
    if (!selectedExam) {
      setMarksSheet([]);
      setMarksReason("");
      return;
    }
    if (fetchedMarksData) {
      setMarksSheet(fetchedMarksData.rows);
    }
  }, [selectedExam, fetchedMarksData]);

  const saveResultsMutation = useMutation({
    mutationFn: (publish: boolean) => {
      if (!selectedExam) throw new Error("No exam selected");
      const max = selectedExam.maxMarks || 100;
      const invalid = marksSheet.some(
        (m) => Number.isNaN(Number(m.marksObtained)) || Number(m.marksObtained) < 0 || Number(m.marksObtained) > max
      );
      if (invalid) {
        throw new Error(`All marks must be between 0 and ${max}.`);
      }
      const isPublishedExam = Boolean(fetchedMarksData?.hasPublished) || selectedExam.status === "COMPLETED";
      const trimmedReason = marksReason.trim();
      if (isPublishedExam && trimmedReason.length < 10) {
        throw new Error("Modifying completed/published results requires an audit reason of at least 10 characters.");
      }
      if (trimmedReason.length > 0 && trimmedReason.length < 10) {
        throw new Error("Audit note must be at least 10 characters when provided (or leave blank for draft).");
      }
      return examsApi.enterResults(
        selectedExam.id,
        marksSheet.map((m) => ({ studentId: m.studentId, marksObtained: Number(m.marksObtained) })),
        trimmedReason || undefined
      ).then(async () => {
        if (publish) {
          await examsApi.publishResults(selectedExam.id);
        }
      });
    },
    onSuccess: (_, publish) => {
      toast.success(publish ? "Exam results published & notified to students!" : "Draft marks saved successfully!");
      if (publish) setSelectedExam(null);
      queryClient.invalidateQueries({ queryKey: ["exam_results", selectedExam?.id] });
      refetchExams();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save marks");
    },
  });

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leaveTo < leaveFrom) {
      toast.error("Leave end date cannot be earlier than start date.");
      return;
    }
    leaveMutation.mutate({
      fromDate: leaveFrom,
      toDate: leaveTo,
      reason: leaveReason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Good morning, Professor {facultyLastName} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Faculty Academic Portal • {classCount} course offering{classCount === 1 ? "" : "s"} assigned in current scope.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href="/teacher/attendance">
            <Button size="sm" className="text-xs gap-1.5 shadow-md shadow-brand-500/20">
              <CalendarCheck2 className="h-4 w-4" /> Mark Daily Attendance
            </Button>
          </Link>
          <Link href="/teacher/assignments">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <FileCheck className="h-4 w-4" /> Grade Queue ({pendingGradingCount})
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLeaveOpen(true)}
            className="text-xs gap-1.5"
          >
            <Plane className="h-4 w-4" /> Apply Leave
          </Button>
        </div>
      </div>

      {/* Priority Action Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-700 dark:text-brand-300">Course Offerings</span>
            <CalendarDays className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground font-mono">
            {classCount} Active
          </div>
          <p className="text-[11px] text-muted-foreground">
            {classCount > 0 ? `Assigned sections and labs` : "No classes assigned yet"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Students At Risk</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {atRiskCount} Below 75%
          </div>
          <p className="text-[11px] text-muted-foreground">
            {atRiskCount > 0 ? "Subject shortage alerts flagged" : "All students currently eligible"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Grading Pending</span>
            <FileCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {pendingGradingCount} Submissions
          </div>
          <p className="text-[11px] text-muted-foreground">
            Coursework and lab assignments
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Workload Compliance</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            Active
          </div>
          <p className="text-[11px] text-muted-foreground">
            Within AICTE statutory faculty limits
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Classes & Students At Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-brand-600" />
                Teaching Schedule & Attendance Status
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mark roll call and manage student rosters.
              </p>
            </div>
            <Link href="/teacher/attendance" className="text-xs font-semibold text-brand-600 hover:underline">
              Launch Roster
            </Link>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {classesLoading ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : classCount === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed border-border text-muted-foreground text-xs">
                No teaching offerings assigned for the current academic session.
              </div>
            ) : (
              classes?.map((cls, idx) => (
                <div
                  key={(cls as any).slotId || `${cls.id}-${cls.time}-${idx}`}
                  className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{cls.subjectCode}</span>
                      <span className="font-medium text-foreground">({cls.subjectName})</span>
                      <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded">
                        Sec {cls.section}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px] mt-1 flex items-center gap-3">
                      <span>Room: <strong>{cls.room}</strong></span>
                      <span>Enrolled: <strong>{cls.enrolledStudents} Students</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {cls.attendanceMarked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Marked
                      </span>
                    ) : (
                      <Link href="/teacher/attendance">
                        <Button size="sm" className="text-xs h-8">
                          Mark Attendance
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students Warning Feed */}
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Defaulters Alert (Below 75%)
              </CardTitle>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-bold">
                Debarment Risk
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Students requiring immediate counseling or attendance condonation.
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2.5">
            {riskLoading ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : atRiskCount === 0 ? (
              <div className="p-6 text-center border rounded-xl border-dashed border-border text-muted-foreground text-xs">
                No students currently flagged below the 75% regulatory attendance threshold.
              </div>
            ) : (
              atRiskStudents?.map((s: TeacherAtRiskStudent) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-card border border-border text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{s.name} ({s.rollNumber})</span>
                    <span className="font-mono font-bold text-rose-600">{s.attendance}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {s.reason}
                  </p>
                </div>
              ))
            )}
            <Link href="/teacher/students" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Inspect Complete Batch Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timetable & Leave Applications Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              Full Weekly Teaching Timetable ({weeklySlots.length} Slots)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2.5 text-xs max-h-72 overflow-y-auto">
            {weeklySlots.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No recurring timetable slots assigned yet.</p>
            ) : (
              (["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const).map((day) => {
                const daySlots = weeklySlots.filter((s) => s.dayOfWeek === day);
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className="rounded-xl border border-border p-3 space-y-1.5">
                    <div className="font-bold text-[11px] text-brand-600 uppercase">{day}</div>
                    {daySlots.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1 border-t border-border/50 first:border-t-0">
                        <span className="font-medium">
                          {s.subjectOffering?.subject?.code} {s.subjectOffering?.subject?.name} (Sec {s.subjectOffering?.section?.name || "A"})
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {minutesToTimeString(s.startMinute)}–{minutesToTimeString(s.endMinute)} • {s.room?.code || "TBA"}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plane className="h-4 w-4 text-brand-600" />
              My Leave Requests ({myLeaves.length})
            </CardTitle>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsLeaveOpen(true)}>
              <Plus className="h-3 w-3 mr-1" /> New Leave
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs max-h-72 overflow-y-auto">
            {myLeaves.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No leave applications submitted.</p>
            ) : (
              myLeaves.map((leave) => (
                <div key={leave.id} className="rounded-xl border border-border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">
                      {new Date(leave.fromDate).toISOString().split("T")[0]} → {new Date(leave.toDate).toISOString().split("T")[0]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : leave.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{leave.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* EXAMINATIONS & MARKS EVALUATION CONSOLE */}
      <Card>
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-600" />
              Examination Evaluation & Marks Publishing Console
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter mid-term, practical, and internal exam marks with automated letter-grade computation and SGPA sync.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {examsLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : !exams || exams.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No examinations currently scheduled or pending marks entry for your courses.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{exam.title}</span>
                      <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded font-mono font-semibold">
                        {exam.type}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        exam.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-3">
                      <span>Scheduled: {formatDate(exam.scheduledAt)}</span>
                      <span>•</span>
                      <span>Max Marks: {exam.maxMarks}</span>
                      <span>•</span>
                      <span>Pass Marks: {exam.passMarks}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedExam(exam)}
                      className="text-xs h-8 gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Enter / Edit Marks
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Application Feedback Banner */}
      {leaveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{leaveSuccess}</span>
        </div>
      )}

      {/* Teacher Leave Request Modal */}
      <Dialog
        isOpen={isLeaveOpen}
        onClose={() => setIsLeaveOpen(false)}
        title="Faculty Leave Application"
        description="Formal statutory leave application submitted to HOD."
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">From Date</label>
              <input
                type="date"
                value={leaveFrom}
                onChange={(e) => setLeaveFrom(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">To Date</label>
              <input
                type="date"
                value={leaveTo}
                onChange={(e) => setLeaveTo(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Reason & Academic Coverage Arrangement
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Attending National Faculty Development Programme. Classes will be covered by Prof. Sharma..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              minLength={5}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsLeaveOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={leaveMutation.isPending}>
              Submit to HOD
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Marks Entry Spreadsheet Modal */}
      <Dialog
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        title={`Marks Entry: ${selectedExam?.title || "Examination"}`}
        description={`Input marks obtained by students (0 - ${selectedExam?.maxMarks || 100}). Draft marks can be saved or immediately published.`}
      >
        <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {resultsLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : marksSheet.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-xl">
              No students enrolled in this offering or marks sheet pending initialization.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 font-bold px-2 text-[11px] text-muted-foreground">
                <span className="col-span-3">Roll Number</span>
                <span className="col-span-5">Candidate Name</span>
                <span className="col-span-4 text-right">Marks (/{selectedExam?.maxMarks})</span>
              </div>
              <div className="divide-y divide-border border rounded-xl overflow-hidden">
                {marksSheet.map((student, idx) => (
                  <div key={student.studentId} className="grid grid-cols-12 gap-2 items-center p-2.5 bg-card">
                    <span className="col-span-3 font-mono font-bold text-foreground truncate">
                      {student.rollNumber}
                    </span>
                    <span className="col-span-5 text-foreground truncate">
                      {student.studentName}
                    </span>
                    <div className="col-span-4 flex justify-end">
                      <Input
                        type="number"
                        min={0}
                        max={selectedExam?.maxMarks || 100}
                        value={student.marksObtained}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMarksSheet((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, marksObtained: val } : item))
                          );
                        }}
                        className="h-7 w-20 text-right font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Audit Justification / Moderation Note (Required if updating published marks)
            </label>
            <Input
              type="text"
              placeholder="e.g. Regular mid-term evaluation scores"
              value={marksReason}
              onChange={(e) => setMarksReason(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setSelectedExam(null)}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saveResultsMutation.isPending || marksSheet.length === 0}
                onClick={() => saveResultsMutation.mutate(false)}
              >
                Save Draft
              </Button>
              {(user?.role === "ADMIN" || user?.role === "EXAM_CONTROLLER" || user?.roleKeys?.includes("EXAM_CONTROLLER") || user?.roleKeys?.includes("COLLEGE_ADMIN")) && (
                <Button
                  size="sm"
                  disabled={saveResultsMutation.isPending || marksSheet.length === 0}
                  isLoading={saveResultsMutation.isPending}
                  onClick={() => saveResultsMutation.mutate(true)}
                >
                  Publish Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
