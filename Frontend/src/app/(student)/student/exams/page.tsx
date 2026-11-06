"use client";

function formatRoom(r: any): string {
  if (!r) return "Hall Assigned";
  if (typeof r === "string") return r;
  return r.code || r.number || "Hall Assigned";
}
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
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth/authStore";

export default function StudentExamsPage() {
  const { user } = useAuthStore();
  const { data: exams, isLoading, error, refetch } = useQuery({
    queryKey: ["student_exams"],
    queryFn: () => studentApi.getExams(),
  });

  const [downloadingAdmitCard, setDownloadingAdmitCard] = useState(false);

  const handleDownloadAdmitCard = () => {
    setDownloadingAdmitCard(true);
    const hallTicketHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Official Examination Hall Ticket - ${user?.rollNumber || "Student"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .sub { font-size: 13px; color: #555; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; text-transform: uppercase; font-size: 11px; }
    .footer { margin-top: 48px; display: flex; justify-content: space-between; font-size: 12px; }
    .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Satyug Darshan Institute of Engineering & Technology</div>
    <div class="sub">Office of the Controller of Examinations • Official Admit Card (Hall Ticket)</div>
  </div>
  <div class="grid">
    <div><strong>Student Name:</strong> ${user?.name || "Verified Student"}</div>
    <div><strong>Roll Number:</strong> ${user?.rollNumber || "SDIET2026"}</div>
    <div><strong>Program / Dept:</strong> Bachelor of Technology (CSE)</div>
    <div><strong>Academic Session:</strong> 2025-2026 (Semester 6)</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Subject Code</th>
        <th>Course Name</th>
        <th>Exam Date</th>
        <th>Time</th>
        <th>Seating Hall</th>
      </tr>
    </thead>
    <tbody>
      ${(exams || []).map(e => `
        <tr>
          <td><strong>${e.subjectCode}</strong></td>
          <td>${e.subjectName}</td>
          <td>${e.date || "Scheduled"}</td>
          <td>${e.startTime || "10:00 AM"} - ${e.endTime || "01:00 PM"}</td>
          <td>${formatRoom(e.room)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
  <div class="footer">
    <div class="sig">Candidate Signature</div>
    <div class="sig">Controller of Examinations</div>
  </div>
</body>
</html>`;

    const blob = new Blob([hallTicketHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `AdmitCard_${user?.rollNumber || "2026"}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setDownloadingAdmitCard(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !exams) {
    return (
      <ErrorState
        message="Could not load examination schedule. Please verify server connection."
        onRetry={refetch}
      />
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
            Semester Examination Schedule & Seating
          </h1>
          <p className="text-xs text-muted-foreground">
            Roll Number: <span className="font-mono font-bold text-foreground">{user?.rollNumber || "Assigned by Registrar"}</span> • Examination Seating Plan.
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
                      <MapPin className="h-3 w-3" /> {formatRoom(exam.room)}
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
