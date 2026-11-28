"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/lib/api/teacher";
import { attendanceApi } from "@/services/api/attendance.api";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Search,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherStudentsPage() {
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>("");
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [inspectStudent, setInspectStudent] = useState<{ id: string; name: string; rollNumber: string } | null>(null);
  const [inspectTab, setInspectTab] = useState<"summary" | "records" | "calendar">("summary");

  const { data: atRiskStudents, isLoading: isRiskLoading } = useQuery({
    queryKey: ["teacher_at_risk_students"],
    queryFn: () => teacherApi.getAtRiskStudents(),
  });

  const { data: offerings = [], isLoading: isOfferingsLoading } = useQuery({
    queryKey: ["teacher_offerings_students"],
    queryFn: () => attendanceApi.getTeacherOfferings({ limit: 100 }),
  });

  useEffect(() => {
    if (offerings.length > 0 && !selectedOfferingId) {
      setSelectedOfferingId(offerings[0].id);
    }
  }, [offerings, selectedOfferingId]);

  const activeOfferingId = selectedOfferingId || offerings[0]?.id || "";

  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ["teacher_section_roster", activeOfferingId],
    queryFn: () => teacherApi.getClassRoster(activeOfferingId),
    enabled: !!activeOfferingId,
  });

  const { data: studentReport, isLoading: reportLoading } = useQuery({
    queryKey: ["teacher_student_att_report", inspectStudent?.id],
    queryFn: () => attendanceApi.getStudentReport(inspectStudent!.id),
    enabled: !!inspectStudent?.id,
  });

  const { data: studentRecordsRaw, isLoading: recordsLoading } = useQuery({
    queryKey: ["teacher_student_att_records", inspectStudent?.id],
    queryFn: () => attendanceApi.getStudentRecords(inspectStudent!.id),
    enabled: !!inspectStudent?.id && inspectTab === "records",
  });

  const { data: studentCalendar, isLoading: calendarLoading } = useQuery({
    queryKey: ["teacher_student_att_calendar", inspectStudent?.id],
    queryFn: () => attendanceApi.getStudentByIdCalendar(inspectStudent!.id),
    enabled: !!inspectStudent?.id && inspectTab === "calendar",
  });

  if (isRiskLoading || isOfferingsLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const offeringsCount = offerings.length;
  const atRiskCount = atRiskStudents?.length || 0;
  const assignedSections =
    offerings.length > 0
      ? offerings.map((o) => `${o.subject?.code} (Sec ${o.section?.name})`).join(", ")
      : "Active Teaching Schedule";

  const avgDefaulterAttendance =
    atRiskStudents && atRiskStudents.length > 0
      ? (
          atRiskStudents.reduce((acc, s) => acc + (s.attendance || 0), 0) /
          atRiskStudents.length
        ).toFixed(1)
      : "0.0";

  const filteredRoster = roster.filter((s) => {
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Enrolled Cohort Roster &amp; Defaulters Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Authorized Offerings: {assignedSections}.
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

      {/* Full Enrolled Section Roster & Student Inspector */}
      <Card>
        <CardHeader className="p-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              Enrolled Students Directory ({filteredRoster.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Browse all enrolled students in your sections and inspect subject-wise attendance standing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select course offering"
              value={activeOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium"
            >
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.subject?.code} — {o.subject?.name} (Sec {o.section?.name})
                </option>
              ))}
            </select>
            <Input
              placeholder="Search name or roll..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="w-44 h-8 text-xs"
              icon={<Search className="h-3 w-3" />}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rosterLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No enrolled students found for the selected offering/search.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-y border-border">
                <tr>
                  <th className="p-3 pl-4">Roll Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3 pr-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRoster.map((st) => (
                  <tr key={st.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-mono font-bold text-foreground">{st.rollNumber}</td>
                    <td className="p-3 font-medium text-foreground">{st.name}</td>
                    <td className="p-3 pr-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] gap-1"
                        onClick={() => setInspectStudent({ id: st.id, name: st.name, rollNumber: st.rollNumber })}
                      >
                        <Eye className="h-3 w-3" /> Inspect Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

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
                <th className="p-3 pr-4">Diagnostic &amp; Reason</th>
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

      {/* Authorized Student Attendance Report Modal */}
      <Dialog
        isOpen={!!inspectStudent}
        onClose={() => {
          setInspectStudent(null);
          setInspectTab("summary");
        }}
        title={inspectStudent ? `${inspectStudent.name} (${inspectStudent.rollNumber})` : "Student Report"}
        description="Subject summary, monthly calendar, and lecture-by-lecture attendance history."
      >
        <div className="space-y-3 text-xs">
          <div className="flex gap-1.5 border-b border-border pb-2">
            {(["summary", "records", "calendar"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setInspectTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                  inspectTab === tab
                    ? "bg-brand-600 text-white"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "summary" ? "Subject Summary" : tab === "records" ? "Lecture Records" : "Month Calendar"}
              </button>
            ))}
          </div>

          {inspectTab === "summary" && (
            reportLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !studentReport ? (
              <p className="text-xs text-muted-foreground py-4">Unable to load attendance summary.</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/30">
                  <span>Overall Standing (Target {studentReport.threshold ?? 75}%)</span>
                  <span className="font-mono font-bold text-base">
                    {studentReport.overall?.percentage ?? 0}% ({studentReport.overall?.attended ?? 0}/{studentReport.overall?.total ?? 0})
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(studentReport.subjects || []).map((sub: any) => (
                    <div key={sub.subjectId} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div>
                        <div className="font-semibold">{sub.subjectName || sub.subjectId}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {sub.attended}/{sub.total} attended • {sub.health}
                        </div>
                      </div>
                      <span className="font-mono font-bold">{sub.percentage ?? 0}%</span>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {inspectTab === "records" && (
            recordsLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(() => {
                  const recs = Array.isArray(studentRecordsRaw)
                    ? studentRecordsRaw
                    : studentRecordsRaw?.items || studentRecordsRaw?.data || [];
                  if (recs.length === 0) {
                    return <p className="text-muted-foreground py-4 text-center">No lecture attendance records found.</p>;
                  }
                  return recs.slice(0, 40).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div>
                        <div className="font-semibold">
                          {r.session?.subjectOffering?.subject?.code || ""} {r.session?.subjectOffering?.subject?.name || "Lecture"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.date ? new Date(r.date).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${
                        r.status === "PRESENT" ? "text-emerald-600" : r.status === "LATE" ? "text-amber-600" : "text-rose-600"
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )
          )}

          {inspectTab === "calendar" && (
            calendarLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !studentCalendar ? (
              <p className="text-muted-foreground py-4 text-center">Unable to load monthly calendar.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{studentCalendar.monthName} {studentCalendar.year}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {studentCalendar.stats.attended}/{studentCalendar.stats.totalClasses} ({studentCalendar.stats.percentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto">
                  {Object.values(studentCalendar.dailyBreakdown || {}).map((d) => (
                    <div
                      key={d.date}
                      className={`p-2 rounded-lg border text-center ${
                        d.absent > 0 && d.attended === 0
                          ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20"
                          : "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20"
                      }`}
                    >
                      <div className="font-mono font-bold">Day {d.day}</div>
                      <div className="text-[10px] text-muted-foreground">P:{d.attended} A:{d.absent}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => { setInspectStudent(null); setInspectTab("summary"); }}>Close</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
