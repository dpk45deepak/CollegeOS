"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function StudentResultsPage() {
  const { user } = useAuthStore();
  const { data: resultsData, isLoading, error, refetch } = useQuery({
    queryKey: ["student_results"],
    queryFn: () => studentApi.getResults(),
  });
  const [examTypeFilter, setExamTypeFilter] = useState<string>("ALL");
  const [semesterFilter, setSemesterFilter] = useState<string>("ALL");

  const allItems = useMemo(() => resultsData?.allResults || resultsData?.results || [], [resultsData]);
  const examTypes = useMemo(() => {
    const set = new Set(allItems.map((r) => r.examType).filter((x): x is string => Boolean(x)));
    return ["ALL", ...Array.from(set)];
  }, [allItems]);
  const semesters = useMemo(() => {
    const set = new Set(allItems.map((r) => r.semesterNumber).filter((x): x is number => typeof x === "number"));
    return ["ALL", ...Array.from(set).sort((a, b) => a - b).map(String)];
  }, [allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (examTypeFilter !== "ALL" && item.examType !== examTypeFilter) return false;
      if (semesterFilter !== "ALL" && String(item.semesterNumber ?? "") !== semesterFilter) return false;
      return true;
    });
  }, [allItems, examTypeFilter, semesterFilter]);

  const displayedSgpa = useMemo(() => {
    if (!filteredItems.length) return resultsData?.sgpa ?? 0;
    const source =
      examTypeFilter === "ALL" && filteredItems.some((r) => r.examType === "END_SEM")
        ? filteredItems.filter((r) => r.examType === "END_SEM")
        : filteredItems;
    const credits = source.reduce((s, r) => s + (r.credits || 0), 0);
    if (!credits) return resultsData?.sgpa ?? 0;
    const pts = source.reduce((s, r) => s + (r.gradePoint ?? 0) * (r.credits || 0), 0);
    return Number((pts / credits).toFixed(2));
  }, [filteredItems, examTypeFilter, resultsData]);

  const institutionalCgpa = user?.cgpa != null ? Number(user.cgpa) : (resultsData?.cgpa ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <ErrorState
        message="Could not load semester examination transcript."
        onRetry={refetch}
      />
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
            Academic Session: {resultsData.academicYear}{(resultsData as any)?.rank ? ` • Class Rank: ${(resultsData as any).rank}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-card border border-border text-center shadow-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Semester GPA
            </span>
            <span className="text-2xl font-extrabold text-brand-600 font-mono">
              {displayedSgpa.toFixed(2)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border text-center shadow-xs">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Cumulative CGPA
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">
              {institutionalCgpa.toFixed(2)}
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
          {resultsData.aiInsights?.summary || "Official examination record."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-lg bg-card border border-border">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">
              Strongest Subject
            </span>
            <span className="font-semibold text-foreground">{resultsData.aiInsights?.strongestSubject || "Core Engineering"}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-card border border-border">
            <span className="text-[10px] text-amber-600 font-bold uppercase block">
              Improvement Target
            </span>
            <span className="font-semibold text-foreground">{resultsData.aiInsights?.needsImprovementSubject || "Electives"}</span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Marks & Grade Table */}
      <Card>
        <CardHeader className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold">
            {semesterFilter === "ALL" ? `Semester ${resultsData.semester}` : `Semester ${semesterFilter}`} Detailed Grade Card
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {semesters.length > 2 && (
              <select
                aria-label="Filter by semester"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem === "ALL" ? "All Semesters" : `Semester ${sem}`}
                  </option>
                ))}
              </select>
            )}
            {examTypes.length > 2 && (
              <select
                aria-label="Filter by examination type"
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
              >
                {examTypes.map((et) => (
                  <option key={et} value={et}>
                    {et === "ALL" ? "All Exam Types" : et.replace("_", " ")}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
              <tr>
                <th className="p-3 pl-4">Course & Assessment</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Marks Obtained</th>
                <th className="p-3">Grade</th>
                <th className="p-3 pr-4">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (<tr><td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">No examination grades published yet for this filter window.</td></tr>) : filteredItems.map((item, idx) => (
                <tr key={item.id || `${item.subjectCode}-${item.examId || item.examType || idx}`} className="hover:bg-muted/20">
                  <td className="p-3 pl-4">
                    <div className="font-semibold text-foreground">{item.subjectName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <span>{item.subjectCode}</span>
                      {item.examType && (
                        <span className="px-1.5 py-0.2 rounded bg-muted text-foreground/80">
                          {item.examType.replace("_", " ")}
                        </span>
                      )}
                      {item.semesterNumber ? <span>• Sem {item.semesterNumber}</span> : null}
                    </div>
                  </td>
                  <td className="p-3 font-mono">{item.credits}</td>
                  <td className="p-3 font-mono font-bold text-foreground">
                    {item.totalMarks}{item.maxMarks ? ` / ${item.maxMarks}` : ""}
                  </td>
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
