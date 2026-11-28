"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hodApi } from "@/lib/api/hod";
import { apiClient } from "@/lib/api/client";
import { academicApi } from "@/services/api/academic.api";
import { timetableApi, minutesToTimeString } from "@/services/api/timetable.api";
import { facultyApi } from "@/services/api/faculty.api";
import { attendanceApi } from "@/services/api/attendance.api";
import { specialistApi } from "@/lib/api/specialist";
import { teacherApi } from "@/lib/api/teacher";
import { reportsApi } from "@/services/api/reports.api";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download } from "lucide-react";
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  Sparkles,
  BarChart3,
  CalendarCheck2,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Plane,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function HodDashboardPage() {
  const queryClient = useQueryClient();
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [subTeacherBySlot, setSubTeacherBySlot] = useState<Record<string, string>>({});
  const [excSlot, setExcSlot] = useState<any | null>(null);
  const [excDate, setExcDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [excType, setExcType] = useState<"SUBSTITUTED" | "CANCELLED">("SUBSTITUTED");
  const [excTeacherId, setExcTeacherId] = useState("");
  const [excReason, setExcReason] = useState("");

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ["hod_metrics"],
    queryFn: () => hodApi.getDepartmentMetrics(),
  });

  const { data: corrections } = useQuery({
    queryKey: ["hod_attendance_corrections"],
    queryFn: () => hodApi.getAttendanceCorrections().catch(() => []),
  });

  const { data: leaveRequests, refetch: refetchLeaves } = useQuery({
    queryKey: ["hod_leave_requests"],
    queryFn: () => hodApi.getLeaveRequests().catch(() => []),
  });

  const { data: shortageList = [] } = useQuery({
    queryKey: ["hod_shortage_list"],
    queryFn: async () => {
      const res = await apiClient<any>("/attendance/analytics/shortage", { params: { limit: 20 } }).catch(() => []);
      return Array.isArray(res) ? res : res?.items || res?.data || [];
    },
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ["hod_attendance_anomalies"],
    queryFn: () => attendanceApi.getAnomalies().catch(() => []),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["hod_sections"],
    queryFn: () => academicApi.listSections().catch(() => []),
  });

  const { data: teachersRaw } = useQuery({
    queryKey: ["hod_teachers"],
    queryFn: () => facultyApi.list({ limit: 100 }).catch(() => []),
  });
  const teachersList = Array.isArray(teachersRaw) ? teachersRaw : teachersRaw?.items || [];

  const activeSectionId = selectedSectionId || sections[0]?.id || "";
  const { data: sectionSlots = [], refetch: refetchSlots } = useQuery({
    queryKey: ["hod_section_slots", activeSectionId],
    queryFn: () => timetableApi.getForSection(activeSectionId).catch(() => []),
    enabled: !!activeSectionId,
  });

  const substituteMutation = useMutation({
    mutationFn: ({ slotId, teacherId }: { slotId: string; teacherId: string }) =>
      specialistApi.updateTimetableSlot(slotId, { teacherId }),
    onSuccess: () => {
      toast.success("Faculty reassigned for timetable slot (conflict-checked)");
      refetchSlots();
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Timetable conflict detected"),
  });

  const { data: deptExceptions = [], refetch: refetchExceptions } = useQuery({
    queryKey: ["hod_timetable_exceptions"],
    queryFn: () => apiClient<any[]>("/timetable/exceptions").catch(() => []),
  });

  const createExceptionMutation = useMutation({
    mutationFn: () => {
      if (!excSlot) throw new Error("No slot selected");
      return teacherApi.createTimetableException({
        slotId: excSlot.id,
        date: excDate,
        type: excType,
        substituteTeacherId: excType === "SUBSTITUTED" ? excTeacherId : undefined,
        reason: excReason.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Single-date timetable override saved");
      setExcSlot(null);
      setExcReason("");
      refetchExceptions();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save lecture exception"),
  });

  const removeExceptionMutation = useMutation({
    mutationFn: (id: string) => teacherApi.removeTimetableException(id),
    onSuccess: () => {
      toast.success("Lecture exception removed");
      refetchExceptions();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to remove exception"),
  });

  const leaveReviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? hodApi.approveLeave(id) : hodApi.rejectLeave(id),
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? "Faculty leave approved" : "Faculty leave rejected");
      refetchLeaves();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to review leave request"),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      hodApi.reviewAttendanceCorrection(id, { approve }),
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? "Attendance correction approved" : "Attendance correction rejected");
      queryClient.invalidateQueries({ queryKey: ["hod_attendance_corrections"] });
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to review correction"),
  });

  const pendingCorrections = (Array.isArray(corrections) ? corrections : []).filter(
    (c: any) => !c.status || c.status === "PENDING"
  );

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error || !metrics) {
    return (
      <ErrorState
        message="Could not load department metrics. Please verify connection to the server."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            Academic Leadership Portal
          </span>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            {metrics.department} — Chair Intelligence
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time departmental oversight on student progress, faculty delivery, and academic performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/notices">
            <Button size="sm" variant="outline" className="text-xs">Dept Notices</Button>
          </Link>
          <Link href="/student/complaints">
            <Button size="sm" variant="outline" className="text-xs">Dept Grievances</Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1"
            onClick={() =>
              reportsApi.downloadCsv("attendance").catch((e: any) => toast.error(e?.message || "Export failed"))
            }
          >
            <Download className="h-3.5 w-3.5" /> Attendance CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1"
            onClick={() =>
              reportsApi.downloadCsv("performance").catch((e: any) => toast.error(e?.message || "Export failed"))
            }
          >
            <Download className="h-3.5 w-3.5" /> Performance CSV
          </Button>
        </div>
      </div>

      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Department Students
          </span>
          <span className="text-2xl font-extrabold text-foreground font-mono">{metrics.totalStudents}</span>
          <p className="text-[11px] text-muted-foreground mt-1">Enrolled across batches</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Teaching Faculty
          </span>
          <span className="text-2xl font-extrabold text-brand-600 font-mono">
            {metrics.totalFaculty > 0 ? metrics.totalFaculty : "Active"}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Faculty workload roster</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Avg Department Attendance
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono">{(metrics.avgAttendance ?? 0).toFixed(1)}%</span>
          <p className="text-[11px] text-muted-foreground mt-1">Statutory target: 75.0%</p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20">
          <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold block">
            Students Below 75%
          </span>
          <span className="text-2xl font-extrabold text-rose-600 font-mono">{metrics.studentsBelow75}</span>
          <p className="text-[11px] text-muted-foreground mt-1">Requiring condonation hearings</p>
        </div>
      </div>

      {/* Faculty Workload & Course Pass Rates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Workload */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              Faculty Teaching Workload (Weekly Hours)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {(!metrics.facultyWorkloadHours || metrics.facultyWorkloadHours.length === 0) ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Workload hours will be aggregated once semester course allocations are locked.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
                  <tr>
                    <th className="p-3 pl-4">Faculty Name</th>
                    <th className="p-3">Courses Handled</th>
                    <th className="p-3 pr-4 text-right">Weekly Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {((metrics.facultyWorkloadHours || [])).map((f, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="p-3 pl-4 font-semibold text-foreground">{f.facultyName}</td>
                      <td className="p-3 text-muted-foreground">{f.subjects?.join(", ") || "General Courses"}</td>
                      <td className="p-3 pr-4 text-right font-mono font-bold text-foreground">
                        {f.hoursPerWeek}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pass Rates */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-brand-600" />
              Subject Evaluation & Pass Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {(!metrics.subjectPassRates || metrics.subjectPassRates.length === 0) ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Subject pass rate benchmarks will appear after end-term grading publication.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
                  <tr>
                    <th className="p-3 pl-4">Subject</th>
                    <th className="p-3">Pass Rate</th>
                    <th className="p-3 pr-4 text-right">Average Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {((metrics.subjectPassRates || [])).map((s, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="p-3 pl-4 font-semibold text-foreground">{s.subject}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">{s.passRate}%</td>
                      <td className="p-3 pr-4 text-right font-mono font-semibold text-foreground">
                        {s.avgScore} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Faculty Leave Applications & Approvals Queue */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Plane className="h-4 w-4 text-brand-600" />
              Faculty Leave Applications & Approvals ({Array.isArray(leaveRequests) ? leaveRequests.length : 0})
            </CardTitle>
            <span className="text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded-full">
              HOD Authority
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {(!leaveRequests || leaveRequests.length === 0) ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <p className="font-semibold text-foreground">No pending faculty leave applications</p>
              <p className="text-[11px]">All department faculty leave requests have been reviewed.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
                <tr>
                  <th className="p-3 pl-4">Faculty Member</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Leave Duration</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaveRequests.map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-semibold text-foreground">
                      {leave.teacher?.user
                        ? `${leave.teacher.user.firstName} ${leave.teacher.user.lastName}`
                        : "Faculty Member"}
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {leave.teacher?.user?.email || ""}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {leave.teacher?.department?.name || "Academic Department"}
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {leave.fromDate ? new Date(leave.fromDate).toISOString().split("T")[0] : ""} to{" "}
                      {leave.toDate ? new Date(leave.toDate).toISOString().split("T")[0] : ""}
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">
                      {leave.reason || "Personal Leave"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : leave.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {leave.status || "PENDING"}
                      </span>
                    </td>
                    <td className="p-3 pr-4 text-right space-x-2">
                      {leave.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => leaveReviewMutation.mutate({ id: leave.id, approve: false })}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                            isLoading={leaveReviewMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => leaveReviewMutation.mutate({ id: leave.id, approve: true })}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            isLoading={leaveReviewMutation.isPending}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Attendance Dispute & Correction Queue */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              Attendance Dispute & Correction Queue ({pendingCorrections.length})
            </CardTitle>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">
              HOD Authority
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {pendingCorrections.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <p className="font-semibold text-foreground">No pending attendance disputes</p>
              <p className="text-[11px]">All student attendance correction requests for this department have been adjudicated.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
                <tr>
                  <th className="p-3 pl-4">Student</th>
                  <th className="p-3">Course / Session</th>
                  <th className="p-3">Requested Status</th>
                  <th className="p-3">Reason & Justification</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingCorrections.map((corr: any) => {
                  const st = corr.attendance?.student || corr.student;
                  return (
                    <tr key={corr.id} className="hover:bg-muted/20">
                      <td className="p-3 pl-4 font-semibold text-foreground">
                        <div>{st?.user ? `${st.user.firstName} ${st.user.lastName}` : corr.studentId || "Student"}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{st?.rollNumber || ""}</div>
                      </td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {corr.attendance?.session?.subjectOffering?.subject?.code || "Course"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {corr.newStatus || "PRESENT"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">
                      {corr.reason || "Medical / On-duty dispute"}
                    </td>
                    <td className="p-3 pr-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewMutation.mutate({ id: corr.id, approve: false })}
                        className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                        isLoading={reviewMutation.isPending}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => reviewMutation.mutate({ id: corr.id, approve: true })}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        isLoading={reviewMutation.isPending}
                      >
                        Approve
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

      {/* Department Shortage Watchlist & Timetable Substitution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Department Attendance Shortage Watchlist ({shortageList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs max-h-72 overflow-y-auto">
            {shortageList.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                No department students currently flagged below threshold.
              </p>
            ) : (
              shortageList.map((s: any) => (
                <div key={s.studentId || s.id} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                  <div>
                    <div className="font-semibold">
                      {s.student?.user ? `${s.student.user.firstName} ${s.student.user.lastName}` : s.name || s.rollNumber}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.student?.rollNumber || s.rollNumber}</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600">{s.percentage ?? s.attendancePercentage ?? 0}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-brand-600" />
                Timetable Oversight &amp; Faculty Substitution
              </CardTitle>
              <select
                aria-label="Select section timetable"
                value={activeSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.semester ? `Sem ${sec.semester.number} • ` : ""}Sec {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2.5 text-xs max-h-72 overflow-y-auto">
            {sectionSlots.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No timetable slots configured for this section.</p>
            ) : (
              sectionSlots.map((slot) => (
                <div key={slot.id} className="rounded-xl border border-border p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {slot.dayOfWeek} {minutesToTimeString(slot.startMinute)}–{minutesToTimeString(slot.endMinute)} • {slot.subjectOffering?.subject?.code}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{slot.room?.code || "TBA"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Assign faculty for slot ${slot.id}`}
                      value={subTeacherBySlot[slot.id] ?? ""}
                      onChange={(e) => setSubTeacherBySlot((prev) => ({ ...prev, [slot.id]: e.target.value }))}
                      className="flex-1 h-8 rounded-lg border border-border bg-background px-2 text-[11px]"
                    >
                      <option value="">
                        Current: {slot.subjectOffering?.teacher?.user ? `${slot.subjectOffering.teacher.user.firstName} ${slot.subjectOffering.teacher.user.lastName}` : "Faculty"}
                      </option>
                      {teachersList.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.user?.firstName} {t.user?.lastName} ({t.employeeId})
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-[11px]"
                      disabled={!subTeacherBySlot[slot.id]}
                      isLoading={substituteMutation.isPending}
                      onClick={() => substituteMutation.mutate({ slotId: slot.id, teacherId: subTeacherBySlot[slot.id] })}
                    >
                      Reassign
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-[11px]"
                      onClick={() => {
                        setExcSlot(slot);
                        setExcType("SUBSTITUTED");
                        setExcTeacherId(teachersList[0]?.id || "");
                        setExcReason("");
                      }}
                    >
                      Date Override
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Date Overrides & Single-Day Substitutions */}
      {deptExceptions.length > 0 && (
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold">
              Active Single-Date Lecture Exceptions ({deptExceptions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs">
            {deptExceptions.map((exc: any) => (
              <div key={exc.id} className="flex items-center justify-between rounded-xl border border-border p-2.5">
                <div>
                  <span className="font-mono font-bold">{new Date(exc.date).toISOString().split("T")[0]}</span>{" "}
                  • <strong>{exc.slot?.subjectOffering?.subject?.code}</strong> ({exc.type})
                  {exc.substituteTeacher?.user && (
                    <span> → Substitute: {exc.substituteTeacher.user.firstName} {exc.substituteTeacher.user.lastName}</span>
                  )}
                  <div className="text-muted-foreground">{exc.reason}</div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => removeExceptionMutation.mutate(exc.id)}>
                  Restore
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attendance Marking Anomalies (GET /attendance/analytics/anomalies) */}
      {anomalies.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Attendance Marking Anomalies ({anomalies.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2 text-xs">
            {anomalies.map((an: any, idx: number) => (
              <div key={`${an.offeringId || idx}-${an.type}`} className="rounded-xl border border-border p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-foreground">
                    {an.subject} — {an.teacher}
                  </div>
                  <div className="text-muted-foreground">{an.detail}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {an.type}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Single-Date Substitute / Cancel Dialog */}
      <Dialog
        isOpen={!!excSlot}
        onClose={() => setExcSlot(null)}
        title={`Date Override: ${excSlot?.subjectOffering?.subject?.code || ""}`}
        description="Assign a one-day substitute faculty or cancel a single lecture date without altering the permanent timetable."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (excReason.trim().length < 3) {
              toast.error("Please enter a reason (min 3 chars)");
              return;
            }
            if (excType === "SUBSTITUTED" && !excTeacherId) {
              toast.error("Please select a substitute faculty member");
              return;
            }
            createExceptionMutation.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={excDate} onChange={(e) => setExcDate(e.target.value)} required />
            <select value={excType} onChange={(e) => setExcType(e.target.value as any)} className="h-9 rounded-lg border border-border bg-background px-2">
              <option value="SUBSTITUTED">Substitute Faculty</option>
              <option value="CANCELLED">Cancel Date</option>
            </select>
          </div>
          {excType === "SUBSTITUTED" && (
            <select value={excTeacherId} onChange={(e) => setExcTeacherId(e.target.value)} className="w-full h-9 rounded-lg border border-border bg-background px-2" required>
              <option value="">Select Substitute Faculty...</option>
              {teachersList.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.user?.firstName} {t.user?.lastName} ({t.employeeId})
                </option>
              ))}
            </select>
          )}
          <Input placeholder="Reason (e.g. Faculty on FDP leave)" value={excReason} onChange={(e) => setExcReason(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setExcSlot(null)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createExceptionMutation.isPending}>Save Override</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
