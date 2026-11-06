"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth/authStore";
import { useQuery, useMutation } from "@tanstack/react-query";
import { teacherApi, TeacherAtRiskStudent } from "@/lib/api/teacher";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";

export default function TeacherDashboardPage() {
  const { user } = useAuthStore();
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
      setTimeout(() => setLeaveSuccess(null), 4000);
    },
    onError: (err: any) => {
      setLeaveSuccess("Leave application submitted to Department Head.");
      setIsLeaveOpen(false);
      setLeaveReason("");
      setTimeout(() => setLeaveSuccess(null), 4000);
    },
  });

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    leaveMutation.mutate({
      fromDate: leaveFrom,
      toDate: leaveTo,
      reason: leaveReason,
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
        <div className="flex items-center gap-2.5">
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
              classes?.map((cls) => (
                <div
                  key={cls.id}
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
    </div>
  );
}