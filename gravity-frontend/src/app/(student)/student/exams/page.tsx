"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function StudentExamsPage() {
  const { data: exams, isLoading } = useQuery({
    queryKey: ["student_exams"],
    queryFn: () => studentApi.getExams(),
  });

  const [downloadingAdmitCard, setDownloadingAdmitCard] = useState(false);

  const handleDownloadAdmitCard = () => {
    setDownloadingAdmitCard(true);
    setTimeout(() => {
      setDownloadingAdmitCard(false);
      alert("Hall Ticket / Admit Card generated and downloaded: AIT-21CS042-MidTerm-2026.pdf");
    }, 1000);
  };

  if (isLoading || !exams) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Hall Ticket Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Examination Control Division
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              Admit Card Ready
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            Autumn Mid-Semester Examinations 2026
          </h1>
          <p className="text-xs text-muted-foreground">
            Roll Number: <span className="font-mono font-bold text-foreground">21CS042</span> • Seat allocated in Examination Complex Hall 4.
          </p>
        </div>

        <Button
          onClick={handleDownloadAdmitCard}
          isLoading={downloadingAdmitCard}
          className="text-xs gap-2 shrink-0 shadow-md shadow-brand-500/20"
        >
          <Download className="h-4 w-4" /> Download Official Hall Ticket
        </Button>
      </div>

      {/* Exam Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Scheduled Papers ({exams.length} Courses)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">
                    {exam.subjectCode}
                  </span>
                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">
                    {exam.examType}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-foreground mt-1">
                  {exam.subjectName}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5 text-brand-600" />
                  <span>{formatDate(exam.date)}</span>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3" /> {exam.startTime} - {exam.endTime}
                    </span>
                    <span className="font-bold text-foreground">Max: {exam.maxMarks}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                    <span className="flex items-center gap-1 font-semibold text-brand-700 dark:text-brand-300">
                      <MapPin className="h-3 w-3" /> {exam.room}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {exam.seatNumber}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Syllabus Coverage:
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {exam.syllabus}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
