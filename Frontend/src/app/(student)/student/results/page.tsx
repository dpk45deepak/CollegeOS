"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  Award,
  TrendingUp,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentResultsPage() {
  const { data: resultsData, isLoading } = useQuery({
    queryKey: ["student_results"],
    queryFn: () => studentApi.getResults(),
  });

  if (isLoading || !resultsData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GPA Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-brand-50/20 dark:to-brand-950/20 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Official Examination Transcript
          </span>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            Academic Performance • Semester {resultsData.semester}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Academic Session: {resultsData.academicYear} • Class Rank: Top 8% of CSE Batch
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-card border border-border text-center shadow-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Semester GPA
            </span>
            <span className="text-2xl font-extrabold text-brand-600 font-mono">
              {resultsData.sgpa.toFixed(2)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border text-center shadow-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Cumulative CGPA
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {resultsData.cgpa.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Performance Insights Card */}
      <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            AI Academic Performance Diagnostics
          </span>
          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-semibold">
            AI Generated Insight
          </span>
        </div>
        <p className="text-xs text-foreground font-medium leading-relaxed">
          {resultsData.aiInsights.summary}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-lg bg-card border border-border">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">
              Strongest Subject
            </span>
            <span className="font-semibold text-foreground">{resultsData.aiInsights.strongestSubject}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-card border border-border">
            <span className="text-[10px] text-amber-600 font-bold uppercase block">
              Improvement Target
            </span>
            <span className="font-semibold text-foreground">{resultsData.aiInsights.needsImprovementSubject}</span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Marks & Grade Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold">
            Semester 5 Detailed Grade Card
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
              <tr>
                <th className="p-3 pl-4">Course</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Internal (50)</th>
                <th className="p-3">End-Term (50)</th>
                <th className="p-3">Total (100)</th>
                <th className="p-3">Grade</th>
                <th className="p-3 pr-4">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resultsData.results.map((item) => (
                <tr key={item.subjectCode} className="hover:bg-muted/20">
                  <td className="p-3 pl-4">
                    <div className="font-semibold text-foreground">{item.subjectName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{item.subjectCode}</div>
                  </td>
                  <td className="p-3 font-mono">{item.credits}</td>
                  <td className="p-3 font-mono">{item.internalMarks}</td>
                  <td className="p-3 font-mono">{item.externalMarks}</td>
                  <td className="p-3 font-mono font-bold text-foreground">{item.totalMarks}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {item.grade}
                    </span>
                  </td>
                  <td className="p-3 pr-4 font-mono font-semibold">{item.gradePoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
