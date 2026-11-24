"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attendanceApi,
  TeacherScheduledSession,
  SessionRosterStudent,
  AttendanceCorrection,
  SectionRegisterResponse,
  TeacherOfferingItem,
} from "@/services/api/attendance.api";
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  Check,
  Send,
  CalendarDays,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TeacherAttendancePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"rollcall" | "register" | "disputes">("rollcall");
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().split("T")[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roster, setRoster] = useState<SessionRosterStudent[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Register state
  const [registerOfferingId, setRegisterOfferingId] = useState<string>("");
  const [registerMonth, setRegisterMonth] = useState<number>(today.getMonth() + 1);
  const [registerYear, setRegisterYear] = useState<number>(today.getFullYear());
  const [registerSearch, setRegisterSearch] = useState("");
  const [registerFilter, setRegisterFilter] = useState<"all" | "defaulters" | "regular">("all");

  // Review Dialog State
  const [reviewingIssue, setReviewingIssue] = useState<AttendanceCorrection | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  // 1. Fetch Teacher's Assigned Timetable for Selected Date
  const { data: scheduledSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["teacher_scheduled_sessions", selectedDate],
    queryFn: () => attendanceApi.getTeacherScheduledSessions(selectedDate),
  });

  // Automatically select the first scheduled lecture when sessions load
  useEffect(() => {
    if (scheduledSessions && scheduledSessions.length > 0) {
      if (!selectedSlotId || !scheduledSessions.some((s) => s.slotId === selectedSlotId)) {
        setSelectedSlotId(scheduledSessions[0].slotId);
      }
    } else {
      setSelectedSlotId("");
      setRoster([]);
    }
  }, [scheduledSessions, selectedSlotId]);

  // 2. Fetch Session Roster for Selected Scheduled Slot
  const { data: rosterData, isLoading: rosterLoading, refetch: refetchRoster } = useQuery({
    queryKey: ["scheduled_session_roster", selectedSlotId, selectedDate],
    queryFn: () => attendanceApi.getScheduledSessionRoster(selectedSlotId, selectedDate),
    enabled: !!selectedSlotId,
  });

  // Sync roster state when session roster loads
  useEffect(() => {
    if (rosterData?.roster) {
      setRoster(rosterData.roster);
    }
  }, [rosterData]);

  // 3. Fetch Teacher's assigned subject offerings for register selector
  const { data: teacherOfferings, isLoading: offeringsLoading } = useQuery({
    queryKey: ["teacher_offerings"],
    queryFn: () => attendanceApi.getTeacherOfferings(),
  });

  // Auto-select first offering if none is selected
  useEffect(() => {
    if (teacherOfferings && teacherOfferings.length > 0 && !registerOfferingId) {
      setRegisterOfferingId(teacherOfferings[0].id);
    } else if (!registerOfferingId && scheduledSessions && scheduledSessions.length > 0) {
      setRegisterOfferingId(scheduledSessions[0].subjectOfferingId);
    }
  }, [teacherOfferings, scheduledSessions, registerOfferingId]);

  // 4. Fetch Register Data for Selected Offering & Month
  const {
    data: registerData,
    isLoading: registerLoading,
    refetch: refetchRegister,
  } = useQuery({
    queryKey: ["section_register", registerOfferingId, registerMonth, registerYear],
    queryFn: () =>
      attendanceApi.getSectionRegister({
        subjectOfferingId: registerOfferingId,
        month: registerMonth,
        year: registerYear,
      }),
    enabled: activeTab === "register" && !!registerOfferingId,
  });

  // 5. Fetch Attendance Disputes for this Teacher
  const { data: disputes, isLoading: disputesLoading, refetch: refetchDisputes } = useQuery({
    queryKey: ["teacher_attendance_corrections"],
    queryFn: () => attendanceApi.listCorrections(),
    enabled: activeTab === "disputes",
  });

  const handleRegisterPrevMonth = () => {
    if (registerMonth === 1) {
      setRegisterMonth(12);
      setRegisterYear((y) => y - 1);
    } else {
      setRegisterMonth((m) => m - 1);
    }
  };

  const handleRegisterNextMonth = () => {
    if (registerMonth === 12) {
      setRegisterMonth(1);
      setRegisterYear((y) => y + 1);
    } else {
      setRegisterMonth((m) => m + 1);
    }
  };

  const handleRegisterCurrentMonth = () => {
    const n = new Date();
    setRegisterMonth(n.getMonth() + 1);
    setRegisterYear(n.getFullYear());
  };

  const handleExportCSV = () => {
    if (!registerData) return;

    const sessionHeaders = registerData.sessions.map(
      (s) => `"${s.day} ${s.dayOfWeek} (${s.date})"`
    );
    const headers = [
      "Roll Number",
      "Student Name",
      "Email",
      ...sessionHeaders,
      "Classes Attended",
      "Classes Held",
      "Attendance Percentage",
    ];

    const rows = (registerData.students || []).map((st) => {
      const sessionValues = registerData.sessions.map((s) => {
        const att = st.attendanceBySession[s.id];
        if (!att || att.status === "NOT_MARKED") return "-";
        return att.status;
      });

      return [
        `"${st.rollNumber}"`,
        `"${st.name}"`,
        `"${st.email || ""}"`,
        ...sessionValues.map((v) => `"${v}"`),
        st.stats.attended,
        st.stats.held,
        `"${st.stats.percentage}%"`,
      ].join(",");
    });

    const dailyPresent = registerData.sessions.map((s) => s.presentCount);
    const dailyAbsent = registerData.sessions.map((s) => s.absentCount);
    const dailyRate = registerData.sessions.map((s) => `"${s.percentage}%"`);

    const summaryRowPresent = [
      '"DAILY PRESENT"',
      '""',
      '""',
      ...dailyPresent,
      '""',
      '""',
      '""',
    ].join(",");
    const summaryRowAbsent = [
      '"DAILY ABSENT"',
      '""',
      '""',
      ...dailyAbsent,
      '""',
      '""',
      '""',
    ].join(",");
    const summaryRowRate = [
      '"DAILY ATTENDANCE %"',
      '""',
      '""',
      ...dailyRate,
      '""',
      '""',
      '""',
    ].join(",");

    const csvContent = [
      headers.join(","),
      ...rows,
      summaryRowPresent,
      summaryRowAbsent,
      summaryRowRate,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Attendance_Register_${registerData.subjectOffering.section.name}_${registerData.subjectOffering.subject.code}_${registerData.monthName}_${registerYear}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Register exported to CSV successfully.");
  };

  const filteredRegisterStudents = (registerData?.students || []).filter((st) => {
    const q = registerSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      st.name.toLowerCase().includes(q) ||
      st.rollNumber.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (registerFilter === "defaulters") {
      return st.stats.percentage < 75;
    }
    if (registerFilter === "regular") {
      return st.stats.percentage >= 75;
    }
    return true;
  });

  const selectedSession = scheduledSessions?.find((s) => s.slotId === selectedSlotId);

  const handleStatusChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT" | "LATE") => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSession) throw new Error("No timetable lecture selected.");
      return attendanceApi.mark({
        subjectOfferingId: selectedSession.subjectOfferingId,
        timetableSlotId: selectedSession.slotId,
        date: selectedDate,
        records: roster.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remark: s.remark,
        })),
      });
    },
    onSuccess: (data) => {
      setIsConfirmOpen(false);
      const msg = `Attendance saved: ${data.created} student(s) marked.${
        data.skippedAlreadyMarked?.length
          ? ` (${data.skippedAlreadyMarked.length} records preserved per institutional policy)`
          : ""
      }`;
      setSubmittedMessage(msg);
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["teacher_scheduled_sessions", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["scheduled_session_roster", selectedSlotId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["teacher_classes"] });
      setTimeout(() => setSubmittedMessage(null), 5000);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to submit attendance records.");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approve, note }: { id: string; approve: boolean; note?: string }) => {
      return attendanceApi.reviewCorrection(id, { approve, note });
    },
    onSuccess: () => {
      toast.success("Attendance dispute review recorded successfully.");
      setReviewingIssue(null);
      setReviewNote("");
      refetchDisputes();
      queryClient.invalidateQueries({ queryKey: ["teacher_attendance_corrections"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled_session_roster"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to record review.");
    },
  });

  const q = (searchQuery || "").toLowerCase().trim();
  const filteredRoster = (roster || []).filter((s) => {
    if (!s) return false;
    if (!q) return true;
    const name = String(s.name || "").toLowerCase();
    const roll = String(s.rollNumber || "").toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  const presentCount = (roster || []).filter((s) => s?.status === "PRESENT").length;
  const absentCount = (roster || []).filter((s) => s?.status === "ABSENT").length;
  const lateCount = (roster || []).filter((s) => s?.status === "LATE").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-brand-600" />
            Institutional Attendance Module
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Timetable-driven lecture delivery, automated roll call, and dispute reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rollcall")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "rollcall"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Timetable Roll Call
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "register"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Attendance Register
          </button>
          <button
            onClick={() => setActiveTab("disputes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "disputes"
                ? "bg-brand-600 text-white shadow-xs"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            Disputes & Issue Review
          </button>
        </div>
      </div>

      {activeTab === "rollcall" && (
        <div className="space-y-6">
          {/* Controls: Date Picker & Actions */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold"
                  />
                </div>
                <div className="self-end pb-0.5 text-xs text-muted-foreground">
                  {scheduledSessions?.length || 0} scheduled lecture(s) found
                </div>
              </div>

              {selectedSession && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("PRESENT")}
                    disabled={roster.length === 0}
                    className="text-xs gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAll("ABSENT")}
                    disabled={roster.length === 0}
                    className="text-xs gap-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-600" /> Mark All Absent
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={roster.length === 0}
                    className="text-xs gap-1.5 shadow-md shadow-brand-500/20"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit to Register
                  </Button>
                </div>
              )}
            </div>

            {submittedMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{submittedMessage}</span>
              </div>
            )}

            {/* Scheduled Lectures Selector (Cards) */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                Assigned Timetable Lectures
              </label>

              {sessionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : (scheduledSessions || []).length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-xl border-border bg-muted/20 text-muted-foreground text-xs space-y-1">
                  <CalendarDays className="h-6 w-6 mx-auto text-muted-foreground/60 mb-1" />
                  <p className="font-semibold text-foreground">No scheduled lectures found for this date.</p>
                  <p className="text-[11px]">
                    The institutional timetable is the sole authority for class schedules. Teachers cannot enter unscheduled sessions.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scheduledSessions?.map((session) => {
                    const isSelected = session.slotId === selectedSlotId;
                    return (
                      <button
                        key={session.slotId}
                        type="button"
                        onClick={() => setSelectedSlotId(session.slotId)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500"
                            : "border-border bg-card hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono font-bold text-xs text-foreground">
                            {session.subject.code}
                          </span>
                          {session.isMarked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="h-3 w-3" /> Recorded ({session.markedCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </div>

                        <div className="font-semibold text-xs text-foreground truncate">
                          {session.subject.name}
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>Sec {session.section.name} • {session.room?.code || "Room TBD"}</span>
                          <span className="font-mono font-bold text-foreground">
                            {session.startTime} - {session.endTime}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Roster & Roll Call Table */}
          {selectedSession && (
            <Card>
              <CardHeader className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-600" />
                    Enrolled Roster: {selectedSession.subject.code} ({selectedSession.section.name})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Timing: {selectedSession.startTime} - {selectedSession.endTime} • Room: {selectedSession.room?.code || "TBD"} • Total: {roster.length} students
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search by name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 h-8 text-xs"
                    icon={<Search className="h-3 w-3" />}
                  />
                  {/* Quick stats pill */}
                  <div className="flex items-center gap-2 bg-muted px-2.5 py-1 rounded-lg text-xs font-semibold">
                    <span className="text-emerald-600">P: {presentCount}</span>
                    <span className="text-rose-600">A: {absentCount}</span>
                    <span className="text-amber-600">L: {lateCount}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                {rosterLoading ? (
                  <div className="p-6 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    No enrolled students match your search criteria.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                      <tr>
                        <th className="p-3 pl-4">Roll Number</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Recorded Status</th>
                        <th className="p-3 pr-4 text-right">Status Selection (P / A / L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredRoster.map((student) => {
                        return (
                          <tr key={student.studentId} className="hover:bg-muted/20">
                            <td className="p-3 pl-4 font-mono font-semibold text-foreground">
                              {student.rollNumber}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-foreground block">{student.name}</span>
                              {student.email && (
                                <span className="text-[10px] text-muted-foreground block">{student.email}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`font-semibold text-xs ${
                                  student.status === "PRESENT"
                                    ? "text-emerald-600"
                                    : student.status === "LATE"
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {student.status}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-right">
                              <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                                  className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                                    student.status === "PRESENT"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.studentId, "LATE")}
                                  className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                                    student.status === "LATE"
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  L
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                                  className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                                    student.status === "ABSENT"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  A
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submission Modal */}
          <Dialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            title="Confirm Timetable Lecture Attendance"
            description="Institutional roll call verification before committing records to the academic database."
          >
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-bold text-foreground">
                    {selectedSession?.subject.code}: {selectedSession?.subject.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Section & Room:</span>
                  <span className="font-bold text-foreground">
                    Sec {selectedSession?.section.name} ({selectedSession?.room?.code || "TBD"})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled Time:</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedSession?.startTime} - {selectedSession?.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-mono font-bold text-foreground">{selectedDate}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Roster Breakdown:</span>
                  <span>
                    {presentCount} Present • {lateCount} Late • {absentCount} Absent ({roster.length} Total)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  Commit Attendance
                </Button>
              </div>
            </div>
          </Dialog>
        </div>
      )}

      {activeTab === "register" && (
        <div className="space-y-6">
          {/* Top Controls: Section Selector, Month Navigation & Filter */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Offering & Section Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Course & Section
                  </label>
                  <select
                    value={registerOfferingId}
                    onChange={(e) => setRegisterOfferingId(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-brand-500 min-w-[260px] cursor-pointer"
                  >
                    {offeringsLoading ? (
                      <option value="">Loading offerings...</option>
                    ) : teacherOfferings && teacherOfferings.length > 0 ? (
                      teacherOfferings.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.subject.code} - {off.subject.name} (Sec {off.section.name})
                        </option>
                      ))
                    ) : scheduledSessions && scheduledSessions.length > 0 ? (
                      scheduledSessions.map((s) => (
                        <option key={s.subjectOfferingId} value={s.subjectOfferingId}>
                          {s.subject.code} - {s.subject.name} (Sec {s.section.name})
                        </option>
                      ))
                    ) : (
                      <option value="">No course offerings found</option>
                    )}
                  </select>
                </div>

                {/* Month Navigation */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Attendance Month
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegisterPrevMonth}
                      className="h-10 w-9 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="px-3 h-10 bg-muted/30 rounded-xl border border-input flex items-center justify-center min-w-[150px]">
                      <span className="text-xs font-bold text-foreground">
                        {registerData?.monthName || "Month"} {registerYear}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegisterNextMonth}
                      className="h-10 w-9 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegisterCurrentMonth}
                      className="h-10 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      Current
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions & CSV Export */}
              <div className="flex items-center gap-2 self-start lg:self-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!registerData || registerData.students.length === 0}
                  className="h-10 text-xs gap-1.5 border-slate-200 dark:border-slate-700 bg-background hover:bg-muted font-medium"
                >
                  <Download className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  Export Register (CSV)
                </Button>
              </div>
            </div>

            {/* Register Summary KPIs */}
            {registerData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Section Students
                  </span>
                  <span className="text-xl font-black font-mono text-foreground">
                    {registerData.summary.totalStudents}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Lectures Conducted
                  </span>
                  <span className="text-xl font-black font-mono text-foreground">
                    {registerData.summary.totalLectures}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold tracking-wider block">
                    Section Average
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      registerData.summary.averagePercentage >= 75
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {registerData.summary.averagePercentage.toFixed(1)}%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold tracking-wider block">
                    Defaulters (&lt;75%)
                  </span>
                  <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {registerData.summary.defaultersCount}
                  </span>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    registerFilter === "all"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({registerData?.students.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterFilter("defaulters")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    registerFilter === "defaulters"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Below 75% ({registerData?.summary.defaultersCount ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterFilter("regular")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    registerFilter === "regular"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                  }`}
                >
                  Eligible &ge;75% (
                  {Math.max(
                    0,
                    (registerData?.students.length ?? 0) - (registerData?.summary.defaultersCount ?? 0)
                  )}
                  )
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter student name or roll no..."
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Authentic Register Ledger Table */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {registerLoading ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !registerData || registerData.students.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60 mb-1" />
                <p className="font-semibold text-foreground text-sm">No students enrolled in this offering</p>
                <p>Please select another subject offering or verify student section enrollments.</p>
              </div>
            ) : registerData.sessions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-xs space-y-3">
                <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/60 mb-1" />
                <p className="font-semibold text-foreground text-sm">
                  No attendance sessions recorded for {registerData.monthName} {registerYear}
                </p>
                <p>
                  Switch to the &quot;Timetable Roll Call&quot; tab to record attendance for scheduled lectures.
                </p>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("rollcall")}
                    className="text-xs gap-1.5"
                  >
                    Go to Timetable Roll Call
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[650px] relative">
                <table className="w-full text-xs text-left border-collapse">
                  {/* Ledger Header */}
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-foreground text-[11px] font-bold sticky top-0 z-30 border-b border-border shadow-xs">
                    <tr>
                      <th className="p-3 pl-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-40 min-w-[100px] border-r border-border/60">
                        Roll Number
                      </th>
                      <th className="p-3 sticky left-[100px] bg-slate-100 dark:bg-slate-800 z-40 min-w-[180px] border-r border-border/60">
                        Student Name
                      </th>

                      {/* Date Columns for Each Lecture Session */}
                      {registerData.sessions.map((s) => (
                        <th
                          key={s.id}
                          className="p-2 text-center min-w-[56px] border-r border-border/40 font-mono"
                          title={`${s.date} (Slot: ${s.periodKey})`}
                        >
                          <div className="font-bold text-xs text-foreground">{s.day}</div>
                          <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                            {s.dayOfWeek}
                          </div>
                          <div className="text-[9px] text-brand-600 dark:text-brand-400 font-mono">
                            {s.periodKey === "DAY" ? "Day" : s.periodKey.slice(-4)}
                          </div>
                        </th>
                      ))}

                      {/* Sticky Right Columns */}
                      <th className="p-3 text-center sticky right-[80px] bg-slate-100 dark:bg-slate-800 z-40 min-w-[80px] border-l border-border/60 font-mono">
                        Attended
                      </th>
                      <th className="p-3 text-center sticky right-0 bg-slate-100 dark:bg-slate-800 z-40 min-w-[80px] border-l border-border/60 font-mono pr-4">
                        Rate %
                      </th>
                    </tr>
                  </thead>

                  {/* Ledger Rows */}
                  <tbody className="divide-y divide-border/60 bg-card">
                    {filteredRegisterStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={registerData.sessions.length + 4}
                          className="p-8 text-center text-muted-foreground text-xs"
                        >
                          No students match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRegisterStudents.map((st, idx) => {
                        const isDefaulter = st.stats.percentage < 75;

                        return (
                          <tr
                            key={st.studentId}
                            className={`hover:bg-muted/30 transition-colors ${
                              idx % 2 === 0 ? "bg-card" : "bg-muted/10"
                            } ${isDefaulter ? "hover:bg-rose-500/5" : ""}`}
                          >
                            <td className="p-2.5 pl-4 sticky left-0 bg-inherit z-20 font-mono font-bold text-foreground border-r border-border/60 whitespace-nowrap">
                              {st.rollNumber}
                            </td>
                            <td className="p-2.5 sticky left-[100px] bg-inherit z-20 font-semibold text-foreground border-r border-border/60 whitespace-nowrap max-w-[200px] truncate">
                              {st.name}
                            </td>

                            {/* Attendance Cells */}
                            {registerData.sessions.map((s) => {
                              const att = st.attendanceBySession[s.id];
                              const status = att?.status;

                              return (
                                <td
                                  key={s.id}
                                  className="p-1 text-center border-r border-border/40"
                                  title={
                                    att
                                      ? `${st.name}: ${status}${att.remark ? ` (${att.remark})` : ""}`
                                      : `${st.name}: No Record`
                                  }
                                >
                                  {status === "PRESENT" ? (
                                    <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center font-black font-mono text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                                      P
                                    </span>
                                  ) : status === "ABSENT" ? (
                                    <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center font-black font-mono text-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25">
                                      A
                                    </span>
                                  ) : status === "LATE" ? (
                                    <span className="inline-flex w-7 h-7 rounded-lg items-center justify-center font-black font-mono text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                                      L
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-mono text-xs">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Summary Attended / Held */}
                            <td className="p-2 text-center sticky right-[80px] bg-inherit z-20 border-l border-border/60 font-mono font-bold text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {st.stats.attended}
                              </span>
                              <span className="text-muted-foreground">/{st.stats.held}</span>
                            </td>

                            {/* Summary Percentage */}
                            <td className="p-2 pr-4 text-center sticky right-0 bg-inherit z-20 border-l border-border/60 font-mono">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  !isDefaulter
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                }`}
                              >
                                {st.stats.percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                  {/* Ledger Footer: Daily Totals */}
                  <tfoot className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold sticky bottom-0 z-30 border-t-2 border-border shadow-xs">
                    <tr className="border-b border-border/40">
                      <td className="p-2.5 pl-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-40 text-muted-foreground border-r border-border/60">
                        DAILY PRESENT
                      </td>
                      <td className="p-2.5 sticky left-[100px] bg-slate-100 dark:bg-slate-800 z-40 text-muted-foreground border-r border-border/60">
                        Students Present
                      </td>
                      {registerData.sessions.map((s) => (
                        <td
                          key={s.id}
                          className="p-1 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold border-r border-border/40"
                        >
                          {s.presentCount + s.lateCount}
                        </td>
                      ))}
                      <td className="p-2 text-center sticky right-[80px] bg-slate-100 dark:bg-slate-800 z-40 border-l border-border/60 font-mono text-emerald-600">
                        {registerData.sessions.reduce(
                          (acc, s) => acc + s.presentCount + s.lateCount,
                          0
                        )}
                      </td>
                      <td className="p-2 pr-4 text-center sticky right-0 bg-slate-100 dark:bg-slate-800 z-40 border-l border-border/60 font-mono text-emerald-600">
                        {registerData.summary.averagePercentage.toFixed(1)}%
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2.5 pl-4 sticky left-0 bg-slate-100 dark:bg-slate-800 z-40 text-muted-foreground border-r border-border/60">
                        DAILY ABSENT
                      </td>
                      <td className="p-2.5 sticky left-[100px] bg-slate-100 dark:bg-slate-800 z-40 text-muted-foreground border-r border-border/60">
                        Students Absent
                      </td>
                      {registerData.sessions.map((s) => (
                        <td
                          key={s.id}
                          className="p-1 text-center font-mono text-xs text-rose-600 dark:text-rose-400 font-bold border-r border-border/40"
                        >
                          {s.absentCount}
                        </td>
                      ))}
                      <td className="p-2 text-center sticky right-[80px] bg-slate-100 dark:bg-slate-800 z-40 border-l border-border/60 font-mono text-rose-600">
                        {registerData.sessions.reduce((acc, s) => acc + s.absentCount, 0)}
                      </td>
                      <td className="p-2 pr-4 text-center sticky right-0 bg-slate-100 dark:bg-slate-800 z-40 border-l border-border/60 font-mono text-rose-600">
                        {(100 - registerData.summary.averagePercentage).toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-600" />
                Student Attendance Disputes & Rectification Requests
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Students filing attendance rectification appeals for your scheduled lectures. Review and adjudicate with formal notes.
              </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {disputesLoading ? (
                <div className="p-6 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (disputes || []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No attendance disputes currently pending your review.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                    <tr>
                      <th className="p-3 pl-4">Student</th>
                      <th className="p-3">Subject / Date</th>
                      <th className="p-3">Current → Requested</th>
                      <th className="p-3">Reason / Justification</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(disputes || []).map((d: any) => {
                      const studentName = d.student?.user
                        ? `${d.student.user.firstName} ${d.student.user.lastName}`
                        : d.attendance?.student?.user
                        ? `${d.attendance.student.user.firstName} ${d.attendance.student.user.lastName}`
                        : "Student";
                      const roll = d.student?.rollNumber || d.attendance?.student?.rollNumber || "ID";
                      const subj = d.attendance?.session?.subjectOffering?.subject?.name || "Subject";
                      const date = d.attendance?.date ? new Date(d.attendance.date).toLocaleDateString() : "Date";

                      return (
                        <tr key={d.id} className="hover:bg-muted/20">
                          <td className="p-3 pl-4">
                            <span className="font-bold text-foreground block">{studentName}</span>
                            <span className="font-mono text-[10px] text-muted-foreground block">{roll}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground block">{subj}</span>
                            <span className="text-[10px] text-muted-foreground block">{date}</span>
                          </td>
                          <td className="p-3 font-mono font-semibold">
                            <span className="text-rose-600">{d.oldStatus || d.attendance?.status || "ABSENT"}</span>
                            {" → "}
                            <span className="text-emerald-600">{d.newStatus || d.requestedStatus || "PRESENT"}</span>
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">
                            {d.reason}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                d.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : d.status === "REJECTED"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            {d.status === "PENDING" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewingIssue(d);
                                  setReviewNote("");
                                }}
                                className="text-xs h-7"
                              >
                                Review Dispute
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Adjudication Dialog */}
          <Dialog
            isOpen={!!reviewingIssue}
            onClose={() => setReviewingIssue(null)}
            title="Adjudicate Student Attendance Dispute"
            description="Review the student's appeal and record an institutional resolution with audit logging."
          >
            {reviewingIssue && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-bold text-foreground">
                      {reviewingIssue.student?.user
                        ? `${reviewingIssue.student.user.firstName} ${reviewingIssue.student.user.lastName}`
                        : "Student"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rectification Requested:</span>
                    <span className="font-mono font-bold text-foreground">
                      {reviewingIssue.oldStatus || "ABSENT"} → {reviewingIssue.newStatus || "PRESENT"}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-muted-foreground block mb-0.5">Student's Stated Reason:</span>
                    <p className="p-2 rounded bg-background border border-border text-foreground">
                      {reviewingIssue.reason}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground block">
                    Review Decision Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter adjudication remarks or rationale..."
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    isLoading={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({ id: reviewingIssue.id, approve: false, note: reviewNote })
                    }
                  >
                    <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject Dispute
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    isLoading={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({ id: reviewingIssue.id, approve: true, note: reviewNote })
                    }
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve & Rectify
                  </Button>
                </div>
              </div>
            )}
          </Dialog>
        </div>
      )}
    </div>
  );
}
