"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { specialistApi } from "@/lib/api/specialist";
import { academicApi } from "@/services/api/academic.api";
import { reportsApi } from "@/services/api/reports.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  IndianRupee,
  TrendingUp,
  Download,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function PrincipalDashboardPage() {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  const { data: departments = [] } = useQuery({
    queryKey: ["principal-departments"],
    queryFn: () => academicApi.listDepartments(),
  });

  const {
    data: exec,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["executive-analytics", selectedDeptId],
    queryFn: () => specialistApi.getExecutiveAnalytics(selectedDeptId || undefined),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !exec) {
    return (
      <ErrorState
        title="Executive Analytics Unavailable"
        message="Unable to load institutional overview metrics. Please verify your permissions or retry."
        onRetry={() => refetch()}
      />
    );
  }

  const maxEnrollment = Math.max(1, ...exec.enrollmentTrend.map((b) => b.students));
  const maxCgpaCount = Math.max(1, ...exec.cgpaDistribution.map((b) => b.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Institutional Executive Command
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Verified deterministic institutional telemetry &amp; explainable governance insights ({exec.scope} scope)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by department"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() =>
              reportsApi.downloadCsv("performance").catch((err: any) =>
                toast.error(err?.message || "Failed to export performance report"),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Performance CSV
          </Button>
        </div>
      </div>

      {/* Headline KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Enrolled Students</span>
              <Users className="h-4 w-4 text-brand-600" />
            </div>
            <div className="text-2xl font-bold mt-2">{exec.overview.students}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {exec.overview.studentsBelowThreshold} below {exec.overview.attendanceThreshold}% attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pass Rate &amp; Avg CGPA</span>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2">
              {exec.overview.passPercentage !== null ? `${exec.overview.passPercentage}%` : "N/A"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Average CGPA: {exec.overview.averageCgpa ?? "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Placements &amp; Avg CTC</span>
              <Briefcase className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold mt-2">
              {exec.placementStats.offersAccepted} Accepted / {exec.placementStats.offersIssued} Offered
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {exec.placementStats.averageCtc
                ? `Avg CTC: ₹${Math.round(exec.placementStats.averageCtc).toLocaleString("en-IN")}`
                : `${exec.placementStats.openJobs} open job postings`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Fee Recovery Rate</span>
              <IndianRupee className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2">
              {exec.overview.feeCollection.collectionRatePct !== null
                ? `${exec.overview.feeCollection.collectionRatePct}%`
                : "N/A"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Outstanding: ₹{Math.round(exec.overview.feeCollection.outstanding).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Explainable Decision Support Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Explainable Institutional Decision Support
          </CardTitle>
          <CardDescription>
            Each indicator states the exact metric, database source, evaluation window, and recommended action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exec.insights.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">
              No critical institutional risk thresholds triggered for the selected scope.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exec.insights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-xl border border-border bg-muted/30 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {insight.severity === "CRITICAL" ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      ) : (
                        <Info className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {insight.title}
                    </span>
                    <Badge variant={insight.severity === "CRITICAL" ? "destructive" : "secondary"} className="text-[10px]">
                      {insight.severity}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold text-foreground">{insight.metricValue}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.summary}</p>
                  <div className="pt-2 border-t border-border/60 text-[10px] space-y-1 text-muted-foreground">
                    <div><strong className="text-foreground">Source:</strong> {insight.dataUsed}</div>
                    <div><strong className="text-foreground">Period:</strong> {insight.period} ({insight.basis})</div>
                    <div><strong className="text-foreground">Action:</strong> {insight.recommendedAction}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Comparison + Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              Department Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 pr-3">Dept</th>
                    <th className="py-2 pr-3">Students</th>
                    <th className="py-2 pr-3">Attendance</th>
                    <th className="py-2">Avg CGPA</th>
                  </tr>
                </thead>
                <tbody>
                  {exec.departmentComparison.map((row) => (
                    <tr key={row.department} className="border-b border-border/50">
                      <td className="py-2.5 pr-3 font-semibold">{row.department}</td>
                      <td className="py-2.5 pr-3">{row.students}</td>
                      <td className="py-2.5 pr-3">{row.attendancePct !== null ? `${row.attendancePct}%` : "—"}</td>
                      <td className="py-2.5">{row.avgCgpa ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Batch Enrollment Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {exec.enrollmentTrend.map((b) => (
                <div key={b.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Cohort {b.label}</span>
                    <span className="font-semibold">{b.students} students</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${Math.round((b.students / maxEnrollment) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CGPA Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exec.cgpaDistribution.map((b) => (
                <div key={b.range} className="flex items-center gap-3 text-xs">
                  <span className="w-16 font-mono font-medium">{b.range}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${Math.round((b.count / maxCgpaCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">{b.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
