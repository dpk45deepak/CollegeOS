"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  Briefcase,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function StudentPlacementsPage() {
  const queryClient = useQueryClient();
  const { data: drives, isLoading } = useQuery({
    queryKey: ["student_placements"],
    queryFn: () => studentApi.getPlacements(),
  });

  const [appliedDriveId, setAppliedDriveId] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: (id: string) => studentApi.applyPlacement(id),
    onSuccess: (_, id) => {
      setAppliedDriveId(id);
      queryClient.invalidateQueries({ queryKey: ["student_placements"] });
    },
  });

  if (isLoading || !drives) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Placement Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card to-emerald-50/20 dark:to-emerald-950/20 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Corporate Relations & Career Cell
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Autonomous Matching
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
            Campus Placement & Internship Drives
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Student Profile: Deepak Kumar (CGPA: 8.64, 0 Backlogs, CSE 2026 Batch) • Eligible for Dream Tier.
          </p>
        </div>
      </div>

      {/* Drives Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recommended Openings ({drives.length} Companies)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {drives.map((item) => {
            const isApplied = appliedDriveId === item.id || item.status === "APPLIED";
            const isClosingToday = item.id === "plc_1";

            return (
              <Card key={item.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 truncate">
                      <Building className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                      {item.company}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                      <Sparkles className="h-3 w-3" />
                      {item.matchScore}% Match
                    </span>
                  </div>

                  <CardTitle className="text-sm font-bold text-foreground mt-2">
                    {item.role}
                  </CardTitle>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-extrabold text-emerald-600 font-mono">
                      {item.ctc}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  {/* Skill compatibility chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Required Stack:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hiring Rounds */}
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 text-[11px] space-y-1">
                    <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                      Hiring Process
                    </span>
                    {item.rounds.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-muted-foreground">
                        <span>{i + 1}. {r.name}</span>
                        <span className="font-mono text-[10px]">{r.date}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    {isClosingToday ? (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Closes Tonight!
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Deadline: {formatDate(item.deadline)}
                      </span>
                    )}

                    <Button
                      size="sm"
                      disabled={isApplied || applyMutation.isPending}
                      onClick={() => applyMutation.mutate(item.id)}
                      className="text-xs h-8"
                    >
                      {isApplied ? "Applied" : "1-Click Apply"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
