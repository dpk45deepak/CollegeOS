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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherStudentsPage() {
  const { data: atRiskStudents, isLoading } = useQuery({
    queryKey: ["teacher_at_risk_students"],
    queryFn: () => teacherApi.getAtRiskStudents(),
  });

  if (isLoading || !atRiskStudents) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Cohort Performance & Defaulters Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Authorized Sections: CSE 6A (CS601, CS606) and CSE 4B (CS401).
        </p>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Enrolled Students
          </span>
          <span className="text-2xl font-extrabold text-foreground font-mono">122</span>
          <p className="text-[11px] text-muted-foreground mt-1">Across 2 assigned lecture sections</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Average Attendance
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono">79.2%</span>
          <p className="text-[11px] text-muted-foreground mt-1">+4.2% above statutory 75% baseline</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Assignment Turn-In Rate
          </span>
          <span className="text-2xl font-extrabold text-brand-600 font-mono">91.8%</span>
          <p className="text-[11px] text-muted-foreground mt-1">112 of 122 students submitted on time</p>
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
              {(!atRiskStudents || atRiskStudents.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                    No students currently flagged below the 75% regulatory attendance threshold.
                  </td>
                </tr>
              ) : atRiskStudents.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="p-3 pl-4 font-mono font-bold text-foreground">
                    {s.rollNumber}
                  </td>
                  <td className="p-3 font-semibold text-foreground">{s.name}</td>
                  <td className="p-3 font-mono">{s.subject}</td>
                  <td className="p-3 font-mono font-bold text-rose-600">{s.attendance}%</td>
                  <td className="p-3 pr-4 text-muted-foreground text-[11px]">{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
