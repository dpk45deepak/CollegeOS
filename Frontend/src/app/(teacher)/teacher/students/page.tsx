"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/lib/api/teacher";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Award,
  Sparkles,
  BarChart3,
  CalendarCheck2,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherStudentsPage() {
  const { data: atRiskStudents, isLoading: isRiskLoading } = useQuery({
    queryKey: ["teacher_at_risk_students"],
    queryFn: () => teacherApi.getAtRiskStudents(),
  });

  const { data: classes, isLoading: isClassesLoading } = useQuery({
    queryKey: ["teacher_classes"],
    queryFn: () => teacherApi.getTodayClasses(),
  });

  const isLoading = isRiskLoading || isClassesLoading;

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const offeringsCount = classes?.length || 0;
  const atRiskCount = atRiskStudents?.length || 0;
  const assignedSections =
    classes && classes.length > 0
      ? classes.map((c) => `${c.subjectCode} (Sec ${c.section})`).join(", ")
      : "Active Teaching Schedule";

  const avgDefaulterAttendance =
    atRiskStudents && atRiskStudents.length > 0
      ? (
          atRiskStudents.reduce((acc, s) => acc + (s.attendance || 0), 0) /
          atRiskStudents.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Cohort Performance & Defaulters Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Authorized Sections: {assignedSections}.
        </p>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Active Offerings
            </span>
            <BookOpen className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
            {offeringsCount}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across assigned department sections
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Flagged Defaulters
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-rose-600 font-mono mt-1 block">
            {atRiskCount}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            Students falling below statutory 75% threshold
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Defaulters Average
            </span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600 font-mono mt-1 block">
            {atRiskCount > 0 ? `${avgDefaulterAttendance}%` : "100%"}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            {atRiskCount > 0
              ? "Urgent remedial attendance required"
              : "All cohorts in good standing"}
          </p>
        </div>
      </div>

      {/* At Risk Table */}
      <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Debarment Defaulters Queue (Below 75%)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            These students are statistically projected to be debarred from the semester final without intervention.
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
              <tr>
                <th className="p-3 pl-4">Roll Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Course</th>
                <th className="p-3">Attendance</th>
                <th className="p-3 pr-4">AI Diagnostic & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!atRiskStudents || atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                    No students currently flagged below the 75% regulatory attendance threshold.
                  </td>
                </tr>
              ) : (
                atRiskStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-mono font-bold text-foreground">
                      {s.rollNumber}
                    </td>
                    <td className="p-3 font-semibold text-foreground">{s.name}</td>
                    <td className="p-3 font-mono">{s.subject}</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{s.attendance}%</td>
                    <td className="p-3 pr-4 text-muted-foreground text-[11px]">{s.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
