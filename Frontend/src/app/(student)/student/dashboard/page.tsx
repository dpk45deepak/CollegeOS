"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { useAuthStore } from "@/lib/auth/authStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  Sparkles,
  CalendarCheck2,
  CalendarDays,
  FileText,
  GraduationCap,
  Award,
  CreditCard,
  Gift,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { setCopilotOpen } = useUIStore();

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ["student_dashboard"],
    queryFn: () => studentApi.getDashboard(),
  });

  const studentName = user?.name?.split(" ")[0] || "Student";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <ErrorState
        message="Could not load your academic dashboard. Please ensure backend services are running."
        onRetry={refetch}
      />
    );
  }

  // 1. Attendance Card Calculations
  const worstSubject = dashboard.attendance?.worstSubjects?.[0];
  const overallAtt = dashboard.attendance?.overall;
  const attThreshold = dashboard.attendance?.threshold ?? 75;
  const isAttendanceShort = worstSubject && (worstSubject.percentage ?? 100) < attThreshold;

  // 2. Assignment Due
  const pendingAssignment = dashboard.assignmentsDue?.[0];

  // 3. Upcoming Exam
  const upcomingExam = dashboard.upcomingExams?.[0];

  // 4. Fees
  const feeOutstanding = dashboard.fees?.outstanding ?? 0;

  // 5. Classes Today
  const todaysClasses = dashboard.todaysClasses || [];

  return (
    <div className="space-y-6 select-none">
      {/* Top Personal Assistant Greeting */}
      <div className="clay-card p-6 bg-[var(--bg)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0_var(--edu-border)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-mint)] border-2 border-[var(--text)] text-xs font-bold text-[var(--text)] mb-2 shadow-[1px_1px_0_var(--text)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--cta-dark)]" />
            <span>Campus Intelligence Portal Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight flex items-center gap-2">
            Good morning, {studentName}! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[var(--text-muted)] mt-1">
            Here&apos;s your live schedule, verified attendance records, and upcoming academic milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCopilotOpen(true)}
            className="btn-primary text-xs py-2.5 px-5 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Ask College AI
          </button>
          <Link href="/student/timetable">
            <button className="btn-secondary text-xs py-2.5 px-5 gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Timetable
            </button>
          </Link>
        </div>
      </div>

      {/* Intelligent Priority Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Attendance Status Card */}
        <div className={`clay-card p-5 ${isAttendanceShort ? "bg-[var(--primary)]/20" : "bg-emerald-50/40 dark:bg-emerald-950/20"} flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold font-display ${isAttendanceShort ? "text-rose-700" : "text-emerald-700"} flex items-center gap-1.5`}>
                {isAttendanceShort ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                {isAttendanceShort ? "Attendance Alert" : "Attendance Status"}
              </span>
              <span className={`text-xs font-mono font-bold ${isAttendanceShort ? "text-rose-700 border-rose-500" : "text-emerald-700 border-emerald-500"} bg-[var(--bg)] border-2 px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]`}>
                {overallAtt?.percentage != null ? `${overallAtt.percentage.toFixed(1)}%` : "N/A"}
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)] truncate">
              {worstSubject ? `${worstSubject.subjectName || worstSubject.subjectId}` : "All Courses Monitored"}
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              {isAttendanceShort && worstSubject?.classesNeeded
                ? `Attend ${worstSubject.classesNeeded} more class${worstSubject.classesNeeded > 1 ? "es" : ""} to reach ${attThreshold}%.`
                : overallAtt?.percentage != null && overallAtt.percentage >= attThreshold
                ? `Compliance on track. Regulatory threshold is ${attThreshold}%.`
                : "No active attendance warnings recorded."}
            </p>
          </div>
          <Link
            href="/student/attendance"
            className={`text-xs font-bold ${isAttendanceShort ? "text-rose-600" : "text-emerald-600"} hover:underline flex items-center gap-1`}
          >
            Open Attendance Hub <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 2. Assignment Countdown Card */}
        <div className="clay-card p-5 bg-[var(--secondary)]/20 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-amber-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {pendingAssignment ? "Due Assignment" : "Assignments"}
              </span>
              {pendingAssignment?.maxScore && (
                <span className="text-xs font-bold font-display bg-[var(--bg)] border-2 border-[var(--text)] text-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                  {pendingAssignment.maxScore} Marks
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)] truncate">
              {pendingAssignment ? pendingAssignment.title : "No Pending Deliverables"}
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              {pendingAssignment
                ? `Due: ${pendingAssignment.dueAt ? new Date(pendingAssignment.dueAt).toLocaleDateString() : "Assigned"}`
                : "All current coursework assignments have been submitted."}
            </p>
          </div>
          <Link
            href="/student/assignments"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            {pendingAssignment ? "Submit Deliverable" : "View All Assignments"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 3. Upcoming Exam Card */}
        <div className="clay-card p-5 bg-[var(--accent-purple)]/30 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-purple-800 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                {upcomingExam ? "Upcoming Exam" : "Examinations"}
              </span>
              {upcomingExam?.date && (
                <span className="text-xs font-bold font-display bg-[var(--bg)] border-2 border-[var(--text)] text-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                  {new Date(upcomingExam.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)] truncate">
              {upcomingExam?.offering?.subject?.name || upcomingExam?.type || "Schedule Pending"}
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              {upcomingExam?.room?.number
                ? `Room: ${upcomingExam.room.number} • Seating verified`
                : upcomingExam
                ? "Examination hall tickets will be issued prior to exam date."
                : "No active exams scheduled in the upcoming examination window."}
            </p>
          </div>
          <Link
            href="/student/exams"
            className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
          >
            Examination Portal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 4. Placement & Fee Alerts Card */}
        <div className="clay-card p-5 bg-[var(--accent-mint)]/30 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-[var(--cta-dark)] flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                Fee Account
              </span>
              <span className={`text-xs font-bold font-display bg-[var(--bg)] border-2 border-[var(--text)] ${feeOutstanding > 0 ? "text-amber-700" : "text-emerald-700"} px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]`}>
                {feeOutstanding > 0 ? "Dues Pending" : "No Dues"}
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)]">
              {feeOutstanding > 0 ? `₹${feeOutstanding.toLocaleString("en-IN")} Outstanding` : "All Dues Cleared"}
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              {feeOutstanding > 0
                ? "Final tuition balance clearance required for semester hall ticket."
                : "Your institutional fee ledger has no pending arrears."}
            </p>
          </div>
          <Link
            href="/student/fees"
            className="text-xs font-bold text-[var(--cta-dark)] hover:underline flex items-center gap-1"
          >
            {feeOutstanding > 0 ? "Pay Now" : "View Receipts"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Student Quick Actions Bar */}
      <div>
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Quick Academic Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: "Safe-Bunk Calc", href: "/student/attendance", icon: CalendarCheck2, bg: "bg-[var(--primary)]" },
            { label: "Today's Schedule", href: "/student/timetable", icon: CalendarDays, bg: "bg-[var(--secondary)]" },
            { label: "Assignments", href: "/student/assignments", icon: FileText, bg: "bg-[var(--accent-mint)]" },
            { label: "Exams & Seating", href: "/student/exams", icon: GraduationCap, bg: "bg-[var(--accent-purple)]" },
            { label: "Results & SGPA", href: "/student/results", icon: Award, bg: "bg-[var(--primary)]" },
            { label: "Pending Fees", href: "/student/fees", icon: CreditCard, bg: "bg-[var(--secondary)]" },
            { label: "Scholarships", href: "/student/scholarships", icon: Gift, bg: "bg-[var(--accent-mint)]" },
            { label: "Placements", href: "/student/placements", icon: Briefcase, bg: "bg-[var(--accent-purple)]" },
            { label: "Raise Grievance", href: "/student/complaints", icon: AlertCircle, bg: "bg-[var(--primary)]" },
            { label: "College Bylaws", href: "/documents", icon: Sparkles, bg: "bg-[var(--secondary)]" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-2xl border-2 border-border bg-card hover:bg-[var(--secondary)]/20 transition-all shadow-[2px_2px_0_var(--edu-border)] hover:translate-x-[1px] hover:translate-y-[1px] group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-xl border-2 border-[var(--text)] ${item.bg} flex items-center justify-center shrink-0 shadow-[1px_1px_0_var(--text)]`}>
                  <Icon className="h-4 w-4 text-[var(--text)]" />
                </div>
                <span className="text-xs font-bold font-display text-[var(--text)] truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Today's Classes & AI Insight Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                Today&apos;s Class Schedule
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {todaysClasses.length > 0 ? `${todaysClasses.length} lecture session(s) scheduled for today` : "No lectures scheduled today"}
              </p>
            </div>
            <Link
              href="/student/timetable"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
            >
              Full Week <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysClasses.length === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed border-border text-muted-foreground text-xs space-y-1">
                <p className="font-semibold text-foreground">No lectures scheduled today</p>
                <p>Check the weekly timetable for upcoming class slots and lab sessions.</p>
              </div>
            ) : (
              todaysClasses.map((slot: any, i: number) => {
                const subjectTitle = slot.subject?.name || slot.subject?.code || slot.subjectCode || "Class Session";
                const roomName = slot.room?.number || slot.room || "Room Assigned";
                const teacherName = slot.teacher?.user
                  ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`.trim()
                  : slot.instructor || "Faculty Assigned";

                return (
                  <div
                    key={slot.id || i}
                    className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all bg-card border-border hover:bg-muted/40"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0 w-36">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">
                          {subjectTitle}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {roomName} • {teacherName}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                        Scheduled
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* AI Performance Advisor Card */}
        <div className="space-y-4">
          <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Academic Advisor
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-medium">
                  Verified Model
                </span>
              </div>
              <CardTitle className="text-sm font-bold text-foreground mt-1">
                Academic Trajectory Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                {dashboard.academicInsight?.reasons?.[0] ||
                  "Your academic progress is actively monitored. Regular attendance and timely submissions ensure optimal semester grades."}
              </p>
              {dashboard.academicInsight?.level && (
                <div className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Status Indicator
                  </span>
                  <p className="text-[11px] text-foreground font-medium">
                    Academic Risk Level: {dashboard.academicInsight.level}
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopilotOpen(true)}
                className="w-full text-xs gap-1.5"
              >
                Chat with Copilot <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Pending Fee Mini Widget */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Current Semester Dues
                </span>
                <span className={`text-xs font-bold ${feeOutstanding > 0 ? "text-amber-600 bg-amber-50 dark:bg-amber-950" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950"} px-2 py-0.5 rounded-full`}>
                  {feeOutstanding > 0 ? "Balance Due" : "Settled"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-foreground">
                  ₹{feeOutstanding.toLocaleString("en-IN")}
                </span>
              </div>
              <Link href="/student/fees" className="block">
                <Button size="sm" variant="subtle" className="w-full text-xs">
                  {feeOutstanding > 0 ? "Pay Online Receipt" : "View Payment History"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
