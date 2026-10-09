"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { teacherApi, StudentRosterItem } from "@/lib/api/teacher";
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Users,
  Check,
  Send,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("cls_1");
  const [selectedDate, setSelectedDate] = useState("2026-10-09");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: initialRoster, isLoading } = useQuery({
    queryKey: ["teacher_roster", selectedClass],
    queryFn: () => teacherApi.getClassRoster(selectedClass),
  });

  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Sync initial roster
  React.useEffect(() => {
    if (initialRoster) {
      setRoster(initialRoster);
    }
  }, [initialRoster]);

  const handleStatusChange = (
    studentId: string,
    status: "PRESENT" | "ABSENT" | "LATE"
  ) => {
    setRoster((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: "PRESENT" })));
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      teacherApi.submitAttendance(
        selectedClass,
        roster.map((s) => ({ studentId: s.id, status: s.status }))
      ),
    onSuccess: (data) => {
      setIsConfirmOpen(false);
      setSubmittedMessage(data.message);
      setTimeout(() => setSubmittedMessage(null), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const filteredRoster = roster.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = roster.filter((s) => s.status === "PRESENT").length;
  const absentCount = roster.filter((s) => s.status === "ABSENT").length;
  const lateCount = roster.filter((s) => s.status === "LATE").length;

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Mark Class Roll Call
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live biometric-linked attendance register for Department of CSE.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="text-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Mark All Present
            </Button>
            <Button
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
              className="text-xs gap-1.5 shadow-md shadow-brand-500/20"
            >
              <Send className="h-3.5 w-3.5" /> Submit to Register
            </Button>
          </div>
        </div>

        {submittedMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{submittedMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Select Course & Section
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            >
              <option value="cls_1">CS601: DBMS (Section 6A) - LT-204</option>
              <option value="cls_2">CS606: DBMS Lab (6A-B1) - Lab 3B</option>
              <option value="cls_3">CS401: DSA (Section 4B) - LT-108</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Lecture Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Search Roster
            </label>
            <Input
              placeholder="Filter by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-3.5 w-3.5" />}
            />
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center justify-around p-1.5 rounded-lg bg-muted text-xs">
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground block">Present</span>
              <span className="font-bold text-emerald-600 font-mono">{presentCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground block">Absent</span>
              <span className="font-bold text-rose-600 font-mono">{absentCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground block">Late</span>
              <span className="font-bold text-amber-600 font-mono">{lateCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Roster Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="p-3 pl-4">Roll Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Current %</th>
                <th className="p-3 pr-4 text-right">Status Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoster.map((student) => {
                const isDeficit = student.currentAttendancePercent < 75;

                return (
                  <tr key={student.id} className="hover:bg-muted/20">
                    <td className="p-3 pl-4 font-mono font-semibold text-foreground">
                      {student.rollNumber}
                    </td>
                    <td className="p-3 font-medium text-foreground">
                      {student.name}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-mono font-bold ${
                          isDeficit ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {student.currentAttendancePercent.toFixed(1)}%
                      </span>
                      {isDeficit && (
                        <span className="ml-2 text-[9px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                          At Risk
                        </span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "PRESENT")}
                          className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                            student.status === "PRESENT"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "LATE")}
                          className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                            student.status === "LATE"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, "ABSENT")}
                          className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors ${
                            student.status === "ABSENT"
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Attendance Submission"
        description="Verify today's roll call summary before locking records to the academic database."
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course:</span>
              <span className="font-bold text-foreground">Database Management Systems (CS601)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Section:</span>
              <span className="font-bold text-foreground">6A (LT-204)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-mono font-bold text-foreground">{selectedDate}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold">
              <span>Roster Summary:</span>
              <span>
                {presentCount} Present • {lateCount} Late • {absentCount} Absent
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Back to Roster
            </Button>
            <Button
              size="sm"
              isLoading={submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              Confirm & Lock Attendance
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
