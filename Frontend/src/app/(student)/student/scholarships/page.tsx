"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { Scholarship } from "@/types";
import {
  Gift,
  Sparkles,
  CheckCircle2,
  Calendar,
  FileCheck,
  Building2,
  ArrowRight,
  Bookmark,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StudentScholarshipsPage() {
  const queryClient = useQueryClient();
  const { data: scholarships, isLoading, error, refetch } = useQuery({
    queryKey: ["student_scholarships"],
    queryFn: () => studentApi.getScholarships(),
  });

  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: (id: string) => studentApi.applyScholarship(id),
    onSuccess: (_, id) => {
      setAppliedId(id);
      queryClient.invalidateQueries({ queryKey: ["student_scholarships"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !scholarships) {
    return (
      <ErrorState
        message="Could not load scholarship programs. Please verify server connection."
        onRetry={refetch}
      />
    );
  }

  if (false) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const handleWhyEligible = (s: Scholarship) => {
    setSelectedScholarship(s);
    setIsWhyModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-pink-50/20 dark:to-pink-950/20 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
              AI Scholarship Match Engine
            </span>
            <span className="text-[10px] bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200 px-2 py-0.5 rounded-full font-bold">
              {scholarships.length} Active {scholarships.length === 1 ? "Grant" : "Grants"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            Institutional & Government Aid Grants
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Matched against your verified enrollment, academic standing, and institutional aid guidelines.
          </p>
        </div>
      </div>

      {/* Scholarship Cards Grid */}
      {scholarships.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border bg-card/50 text-xs text-muted-foreground space-y-2">
          <Gift className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="font-semibold text-foreground">No matching scholarship schemes currently active.</p>
          <p>Institutional and government scholarship notifications will appear here when applications open.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {scholarships.map((sch) => {
          const isHighMatch = sch.matchScore >= 80;
          const isApplied = appliedId === sch.id || sch.status === "APPLIED";

          return (
            <Card key={sch.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-brand-500" />
                    {sch.provider}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isHighMatch
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    {sch.matchScore}% Match
                  </div>
                </div>

                <CardTitle className="text-sm font-bold text-foreground mt-2">
                  {sch.title}
                </CardTitle>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-lg font-extrabold text-brand-600 font-mono">
                    {formatCurrency(sch.amount)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Annual Grant</span>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {sch.eligibilitySummary}
                </p>

                {/* Documents needed chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Required Credentials:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {((sch.documentsNeeded || [])).map((doc, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleWhyEligible(sch)}
                    className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> Why am I eligible?
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Due: {formatDate(sch.deadline)}
                    </span>
                    <Button
                      size="sm"
                      disabled={isApplied || applyMutation.isPending}
                      onClick={() => applyMutation.mutate(sch.id)}
                      className="text-xs h-8"
                    >
                      {isApplied ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* "Why am I eligible?" AI Explainer Modal */}
      <Dialog
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        title={selectedScholarship ? `AI Compatibility Analysis: ${selectedScholarship.title}` : "AI Eligibility Breakdown"}
        description="Transparent breakdown generated by the Academic Copilot."
      >
        {selectedScholarship && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Eligibility Score: {selectedScholarship.matchScore}% Match
                </span>
                <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 px-2 py-0.5 rounded font-mono font-bold">
                  High Confidence
                </span>
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                {selectedScholarship.aiReasoning}
              </p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-foreground">Rule Verification Check:</span>
              <ul className="space-y-1.5 text-muted-foreground">
                {((selectedScholarship?.requirements || [])).map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsWhyModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
