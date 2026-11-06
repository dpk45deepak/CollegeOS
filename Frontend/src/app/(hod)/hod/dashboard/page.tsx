"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hodApi } from "@/lib/api/hod";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function HodDashboardPage() {
  const queryClient = useQueryClient();

  const { data: metrics, isLoading, error, refetch } = useQuery({
    queryKey: ["hod_metrics"],
    queryFn: () => hodApi.getDepartmentMetrics(),
  });

  const { data: corrections } = useQuery({
    queryKey: ["hod_attendance_corrections"],
    queryFn: () => hodApi.getAttendanceCorrections().catch(() => []),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      hodApi.reviewAttendanceCorrection(id, { approve }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hod_attendance_corrections"] });
      refetch();
    },
  });

  const pendingCorrections = Array.isArray(corrections) ? corrections : [];

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
      <div className="pb-2 border-b border-border">
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
                {pendingCorrections.map((corr: any) => (
                  <tr key={corr.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-semibold text-foreground">
                      <div>{corr.student?.user ? `${corr.student.user.firstName} ${corr.student.user.lastName}` : corr.studentId || "Student"}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{corr.student?.rollNumber || ""}</div>
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
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
