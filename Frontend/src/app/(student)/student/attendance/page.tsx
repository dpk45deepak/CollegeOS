"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { attendanceApi, StudentCalendarDay } from "@/services/api/attendance.api";
import { useStudentAttendanceRecords } from "@/hooks/useStudents";
import { toast } from "sonner";
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldAlert,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Filter,
  Check,
  X,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAttendanceColor } from "@/lib/utils";

export default function StudentAttendancePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["student_attendance"],
    queryFn: () => studentApi.getAttendance(),
  });

  // View mode: summary cards, monthly calendar, or records log
  const [viewMode, setViewMode] = useState<"summary" | "calendar" | "records">("summary");
  const [recordsSubjectId, setRecordsSubjectId] = useState<string>("");
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarSubjectId, setCalendarSubjectId] = useState<string>("");
  const [selectedDayModal, setSelectedDayModal] = useState<StudentCalendarDay | null>(null);

  // Simulator state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [classesToAttend, setClassesToAttend] = useState<number>(3);
  const [classesToMiss, setClassesToMiss] = useState<number>(0);
  const [isDisputeOpen, setIsDisputeOpen] = useState<boolean>(false);
  const [disputeSubject, setDisputeSubject] = useState<string>("");
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [disputeStatus, setDisputeStatus] = useState<"PRESENT" | "LATE">("PRESENT");
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: calendarData, isLoading: isCalendarLoading, refetch: refetchCalendar } = useQuery({
    queryKey: ["student_attendance_calendar", calendarMonth, calendarYear, calendarSubjectId],
    queryFn: () =>
      attendanceApi.getStudentCalendar({
        month: calendarMonth,
        year: calendarYear,
        subjectId: calendarSubjectId || undefined,
      }),
  });

  const { data: myDisputes, refetch: refetchDisputes } = useQuery({
    queryKey: ["student_attendance_corrections"],
    queryFn: () => attendanceApi.listCorrections(),
  });

  const { data: rawRecords, isLoading: recordsLoading } = useStudentAttendanceRecords(
    recordsSubjectId ? { subjectId: recordsSubjectId } : undefined
  );
  const attendanceRecordsList = Array.isArray(rawRecords)
    ? rawRecords
    : (rawRecords as any)?.items || (rawRecords as any)?.data || [];

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const n = new Date();
    setCalendarMonth(n.getMonth() + 1);
    setCalendarYear(n.getFullYear());
  };

  const formatCourseOption = (s: { id: string; code?: string; name: string; percentage?: number }) => {
    const isRealCode = Boolean(s.code && s.code !== s.id && s.code.length <= 12 && !/^[c][a-z0-9]{20,}$/i.test(s.code));
    const cleanName = s.name && !/^[c][a-z0-9]{20,}$/i.test(s.name) ? s.name : "Course Subject";
    const pct = s.percentage != null ? ` (${s.percentage.toFixed(1)}%)` : "";
    return isRealCode ? `${s.code}: ${cleanName}${pct}` : `${cleanName}${pct}`;
  };

  const [disputeAttendanceId, setDisputeAttendanceId] = useState<string | undefined>(undefined);

  const disputeMutation = useMutation({
    mutationFn: async (data: { attendanceId?: string; subjectOfferingId?: string; requestedStatus: "PRESENT" | "LATE"; reason: string }) => {
      return attendanceApi.requestCorrection({
        attendanceId: data.attendanceId,
        subjectOfferingId: data.subjectOfferingId,
        newStatus: data.requestedStatus,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      setDisputeSuccess("Attendance rectification appeal submitted successfully to faculty and department head.");
      setIsDisputeOpen(false);
      setDisputeAttendanceId(undefined);
      setDisputeReason("");
      toast.success("Dispute appeal registered with institutional audit logging.");
      refetchDisputes();
      refetch();
      setTimeout(() => setDisputeSuccess(null), 4000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit attendance dispute.");
    },
  });

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subjId = disputeSubject || data?.subjects?.[0]?.id;
    disputeMutation.mutate({
      attendanceId: disputeAttendanceId,
      subjectOfferingId: subjId,
      requestedStatus: disputeStatus,
      reason: disputeReason,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message="Could not fetch attendance records." onRetry={refetch} />;
  }

  const hasSubjects = Boolean(data.subjects && data.subjects.length > 0);
  const selectedSubject = hasSubjects
    ? data.subjects.find((s) => s.id === selectedSubjectId || s.code === selectedSubjectId) || data.subjects[0]
    : null;

  // Simulation calculation
  const simTotal = selectedSubject
    ? selectedSubject.totalClasses + classesToAttend + classesToMiss
    : 0;
  const simAttended = selectedSubject
    ? selectedSubject.attended + classesToAttend
    : 0;
  const simPercentage = simTotal > 0 ? (simAttended / simTotal) * 100 : 0;
  const isSimSafe = selectedSubject
    ? simPercentage >= selectedSubject.requiredPercentage
    : true;

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Attendance Governance Status
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                  (data.overallPercentage ?? 0) >= (data.requiredPercentage ?? 75)
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 dark:bg-rose-500/20 border-rose-500/30"
                }`}
              >
                {(data.overallPercentage ?? 0) >= (data.requiredPercentage ?? 75)
                  ? "Eligible for Hall Ticket"
                  : "Condonation Hearing Required"}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Overall Aggregate: {(data.overallPercentage ?? 0).toFixed(1)}%
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Statutory Requirement: {data.requiredPercentage}% • Total Lectures Held: {data.totalHeld} (Attended: {data.totalAttended})
            </p>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDisputeAttendanceId(undefined);
                  setDisputeReason("");
                  setIsDisputeOpen(true);
                }}
                className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 dark:bg-slate-800/80 hover:dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Request Attendance Correction
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-center shadow-xs min-w-[80px]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">Attended</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{data.totalAttended}</span>
            </div>
            <div className="p-3.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-center shadow-xs min-w-[80px]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">Absent</span>
              <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{Math.max(0, data.totalHeld - data.totalAttended)}</span>
            </div>
            <div className="p-3.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-center shadow-xs min-w-[80px]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider block">Margin</span>
              <span className={`text-xl font-black font-mono ${data.overallPercentage >= data.requiredPercentage ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {((data.overallPercentage ?? 0) - (data.requiredPercentage ?? 75)) >= 0 ? "+" : ""}
                {((data.overallPercentage ?? 0) - (data.requiredPercentage ?? 75)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {disputeSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{disputeSuccess}</span>
        </div>
      )}

      {/* View Switcher: Summary Cards vs Monthly Calendar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "summary"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Subject Cards & Simulator
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "calendar"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Monthly Attendance Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("records")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              viewMode === "records"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Lecture Records Log
          </button>
        </div>

        {viewMode === "calendar" && (
          <span className="text-[11px] text-muted-foreground italic">
            Calendar view showcasing subject lectures held and daily presence
          </span>
        )}
      </div>

      {viewMode === "summary" && (
        <>
          {/* Interactive Safe-Bunk / Attendance Recovery Calculator */}
          {selectedSubject && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
                <div>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Interactive Attendance Recovery & Safe-Bunk Calculator
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Test scenarios: &quot;If I attend next X classes... or miss next Y classes... what happens to my examination eligibility?&quot;
                  </p>
                </div>
                <span className="self-start sm:self-auto text-[11px] font-semibold bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 border border-brand-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                  Real-time Simulation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Select Course
                  </label>
                  <select
                    value={selectedSubject.id}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    {(data.subjects || []).map((s) => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                        {formatCourseOption(s)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Classes to Attend
                    </label>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">
                      {classesToAttend}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={classesToAttend}
                    onChange={(e) => setClassesToAttend(parseInt(e.target.value) || 0)}
                    className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer accent-emerald-500 mt-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Classes to Miss (Bunk)
                    </label>
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold font-mono text-xs">
                      {classesToMiss}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={classesToMiss}
                    onChange={(e) => setClassesToMiss(parseInt(e.target.value) || 0)}
                    className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-700 appearance-none cursor-pointer accent-rose-500 mt-2"
                  />
                </div>
              </div>

              {/* Calculator Output Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Projected Attendance:</span>
                    <span
                      className={`text-xl font-mono font-black ${
                        isSimSafe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {(simPercentage ?? 0).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      ({simAttended} / {simTotal} lectures)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isSimSafe ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Safe! Above the statutory 75% threshold.
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Danger: Below 75%. You will be debarred from the end-term exam.
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-700/60 p-2.5 px-3 rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 font-medium">
                  {selectedSubject.needToAttend > 0 ? (
                    <span>
                      Mandatory Goal: Attend <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSubject.needToAttend}</strong> consecutive lectures.
                    </span>
                  ) : (
                    <span>
                      Safe Buffer: You can miss up to <strong className="text-slate-900 dark:text-white font-bold">{selectedSubject.safeToMiss}</strong> classes.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Subject-Wise Cards Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Course Breakdown ({data.subjects.length} Subjects)
            </h3>

            {!hasSubjects ? (
              <div className="p-8 text-center border rounded-xl border-dashed border-border text-muted-foreground text-xs space-y-1">
                <p className="font-semibold text-foreground">No course enrollments found</p>
                <p>You have not been enrolled into active course sections for this semester yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data.subjects || []).map((sub) => {
                  const colors = getAttendanceColor(sub.percentage ?? 0, sub.requiredPercentage ?? 75);
                  const isDeficit = (sub.percentage ?? 0) < (sub.requiredPercentage ?? 75);

                  return (
                    <Card key={sub.id} className="relative overflow-hidden hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className={`h-1.5 w-full ${colors.bar}`} />
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {sub.code && sub.code !== sub.id && sub.code.length <= 12 && !/^[c][a-z0-9]{20,}$/i.test(sub.code) ? (
                              <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 block mb-0.5">
                                {sub.code}
                              </span>
                            ) : null}
                            <CardTitle className="text-xs font-bold text-foreground mt-0.5 truncate max-w-[200px]">
                              {sub.name && !/^[c][a-z0-9]{20,}$/i.test(sub.name) ? sub.name : "Course Subject"}
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {sub.instructor}
                            </p>
                          </div>
                          <span
                            className={`text-base font-mono font-extrabold ${colors.text} shrink-0`}
                          >
                            {(sub.percentage ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3">
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${colors.bar}`}
                            style={{ width: `${Math.min(sub.percentage ?? 0, 100)}%` }}
                          />
                        </div>

                        {/* Attendance Stats */}
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-muted-foreground block">Held</span>
                            <span className="font-bold text-foreground">{sub.totalClasses}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Present</span>
                            <span className="font-bold text-emerald-600">{sub.attended}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Absent</span>
                            <span className="font-bold text-rose-600">{sub.absent}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Late</span>
                            <span className="font-bold text-amber-600">{sub.late}</span>
                          </div>
                        </div>

                        {/* Advisory Tag */}
                        <div className="text-[11px] font-medium pt-1">
                          {isDeficit ? (
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-between">
                              <span>Deficit Alert</span>
                              <span className="font-bold">Need {sub.needToAttend} classes</span>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                              <span>Safe Margin</span>
                              <span className="font-bold">Can bunk {sub.safeToMiss} classes</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Monthly Attendance Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-6">
          {/* Calendar Toolbar: Month Picker & Subject Filter */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[170px]">
                  <span className="text-sm font-bold text-foreground">
                    {calendarData?.monthName || "Month"} {calendarYear}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTodayMonth}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Current Month
                </Button>
              </div>

              {/* Subject Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <label className="text-xs font-semibold text-muted-foreground shrink-0">
                  Course Filter:
                </label>
                <select
                  value={calendarSubjectId}
                  onChange={(e) => setCalendarSubjectId(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer min-w-[200px]"
                >
                  <option value="">All Enrolled Subjects</option>
                  {(data.subjects || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatCourseOption(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly KPI Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Total Held</span>
                <span className="text-lg font-black font-mono text-foreground">{calendarData?.stats.totalClasses ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider block">Attended</span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{calendarData?.stats.attended ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold tracking-wider block">Absent</span>
                <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">{calendarData?.stats.absent ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-center">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider block">Late</span>
                <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{calendarData?.stats.late ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-brand-700 dark:text-brand-400 uppercase font-bold tracking-wider block">Month Rate</span>
                <span className={`text-lg font-black font-mono ${(calendarData?.stats.percentage ?? 0) >= (data.requiredPercentage ?? 75) ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {(calendarData?.stats.percentage ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-muted-foreground pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-rose-500">SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span className="text-indigo-500">SAT</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Leading placeholders */}
              {Array.from({ length: new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).getUTCDay() }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/40 dark:bg-slate-850/20 border border-transparent" />
              ))}

              {/* Days 1 to daysInMonth */}
              {Array.from({ length: calendarData?.daysInMonth || new Date(calendarYear, calendarMonth, 0).getDate() }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayData = calendarData?.dailyBreakdown?.[dateStr];
                const isToday =
                  today.getDate() === dayNum &&
                  today.getMonth() + 1 === calendarMonth &&
                  today.getFullYear() === calendarYear;

                const hasClasses = Boolean(dayData && dayData.records.length > 0);
                const hasAbsence = Boolean(dayData && dayData.absent > 0);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => dayData && setSelectedDayModal(dayData)}
                    disabled={!hasClasses}
                    className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                      isToday ? "ring-2 ring-brand-500" : ""
                    } ${
                      !hasClasses
                        ? "bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800/60 opacity-70 cursor-default"
                        : hasAbsence
                        ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30 hover:shadow-md hover:border-rose-500/50 cursor-pointer"
                        : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 hover:shadow-md hover:border-emerald-500/50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "bg-brand-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-mono text-[10px]"
                            : "text-foreground"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {hasClasses && dayData && (
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                          {dayData.records.length} cls
                        </span>
                      )}
                    </div>

                    {/* Classes badges preview */}
                    <div className="w-full space-y-1">
                      {hasClasses && dayData ? (
                        calendarSubjectId ? (
                          <div
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-center uppercase tracking-wider ${
                              dayData.records[0].status === "PRESENT"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : dayData.records[0].status === "LATE"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {dayData.records[0].status}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {dayData.records.slice(0, 2).map((r, rIdx) => (
                              <div
                                key={r.id || rIdx}
                                className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold truncate flex items-center justify-between ${
                                  r.status === "PRESENT"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : r.status === "LATE"
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                <span className="truncate">{r.subjectCode || "SUB"}</span>
                                <span>{r.status[0]}</span>
                              </div>
                            ))}
                            {dayData.records.length > 2 && (
                              <span className="text-[9px] text-muted-foreground font-semibold block text-center">
                                +{dayData.records.length - 2} more
                              </span>
                            )}
                          </div>
                        )
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40 inline-block" />
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40 inline-block" />
                  <span>Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700 inline-block" />
                  <span>No Lecture</span>
                </div>
              </div>
              <span className="text-[11px] italic">
                * Click on any active date box to inspect full lecture breakdown and submit dispute appeals.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: CHRONOLOGICAL LECTURE RECORDS LOG (GET /students/me/attendance/records) */}
      {viewMode === "records" && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              Chronological Lecture Attendance Records
            </CardTitle>
            <select
              aria-label="Filter attendance records by subject"
              value={recordsSubjectId}
              onChange={(e) => setRecordsSubjectId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs"
            >
              <option value="">All Subjects</option>
              {(data.subjects || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {formatCourseOption(s)}
                </option>
              ))}
            </select>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {recordsLoading ? (
              <div className="p-6"><Skeleton className="h-36 w-full" /></div>
            ) : attendanceRecordsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No lecture attendance entries found for the selected filter.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attendanceRecordsList.map((rec: any) => {
                    const subj = rec.subject || rec.session?.subjectOffering?.subject;
                    const recSubjId = rec.subjectId || subj?.id;
                    return (
                      <tr key={rec.id} className="hover:bg-muted/20">
                        <td className="p-3 pl-4 font-mono text-[11px]">
                          {rec.date ? new Date(rec.date).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3 font-semibold text-foreground">
                          {subj?.code ? `${subj.code} — ${subj.name}` : subj?.name || "Course Lecture"}
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{rec.periodKey || rec.session?.periodKey || "—"}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === "PRESENT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : rec.status === "LATE"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          {rec.status !== "PRESENT" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => {
                                setDisputeAttendanceId(rec.id);
                                if (recSubjId) setDisputeSubject(recSubjId);
                                setDisputeReason("");
                                setIsDisputeOpen(true);
                              }}
                            >
                              Dispute
                            </Button>
                          )}
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

      {/* Attendance Dispute Appeals History */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            My Attendance Rectification Appeals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {(myDisputes || []).length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              No attendance rectification appeals filed. If you notice an incorrect roll call entry, click &quot;Dispute / Request Correction&quot; above.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-muted-foreground uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 pl-4">Subject</th>
                  <th className="p-3">Lecture Date</th>
                  <th className="p-3">Current → Requested</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3 pr-4">Review Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(myDisputes || []).map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-foreground">
                      {d.attendance?.session?.subjectOffering?.subject?.name || "Course Subject"}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">
                      {d.attendance?.date ? new Date(d.attendance.date).toLocaleDateString() : "Lecture Date"}
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      <span className="text-rose-600">{d.oldStatus || "ABSENT"}</span>
                      {" → "}
                      <span className="text-emerald-600">{d.newStatus || "PRESENT"}</span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">
                      {d.reason}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : d.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-muted-foreground italic">
                      {d.reviewNote || (d.status === "PENDING" ? "Awaiting review" : "No notes")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Request Correction Modal */}
      <Dialog
        isOpen={isDisputeOpen}
        onClose={() => {
          setIsDisputeOpen(false);
          setDisputeAttendanceId(undefined);
        }}
        title="Dispute Attendance / Request Correction"
        description="Formal appeal submitted to the Department Head with institutional audit logging."
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Select Course Subject</label>
            <select
              value={disputeSubject || data?.subjects?.[0]?.id || ""}
              onChange={(e) => setDisputeSubject(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs"
              required
            >
              {(data?.subjects || []).map((s) => (
                <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  {formatCourseOption(s)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Requested Rectification</label>
            <select
              value={disputeStatus}
              onChange={(e) => setDisputeStatus(e.target.value as any)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              <option value="PRESENT">Mark as Present (Medical / Event On-Duty)</option>
              <option value="LATE">Mark as Late Exemption</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Justification & Explanation (Min 10 characters)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Participated in Inter-College Smart India Hackathon with Dean permission..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              minLength={10}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsDisputeOpen(false);
                setDisputeAttendanceId(undefined);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={disputeMutation.isPending}>
              Submit to HOD
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Day Details Inspection Modal */}
      <Dialog
        isOpen={Boolean(selectedDayModal)}
        onClose={() => setSelectedDayModal(null)}
        title={
          selectedDayModal
            ? `Lecture Attendance — ${new Date(selectedDayModal.date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`
            : "Lecture Details"
        }
        description="Comprehensive roll call verification across subjects for this date."
      >
        {selectedDayModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-center text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Held</span>
                <span className="font-bold text-foreground font-mono">{selectedDayModal.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Attended</span>
                <span className="font-bold text-emerald-600 font-mono">{selectedDayModal.attended}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Absent</span>
                <span className="font-bold text-rose-600 font-mono">{selectedDayModal.absent}</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {selectedDayModal.records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-card space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {rec.subjectCode && (
                        <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400 block">
                          {rec.subjectCode}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-foreground">{rec.subjectName}</h4>
                      <span className="text-[11px] text-muted-foreground">Period: {rec.periodKey}</span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : rec.status === "LATE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  {rec.remark && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                      Remark: {rec.remark}
                    </p>
                  )}

                  {rec.status !== "PRESENT" && (
                    <div className="pt-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDayModal(null);
                          setDisputeAttendanceId(rec.id);
                          setDisputeSubject(rec.subjectOfferingId || rec.subjectId);
                          setIsDisputeOpen(true);
                        }}
                        className="text-[11px] h-7 gap-1 border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Dispute Absence
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedDayModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
