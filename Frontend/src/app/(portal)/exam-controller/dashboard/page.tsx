"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { examsApi, ExamItem } from "@/services/api/exams.api";
import { teacherApi } from "@/lib/api/teacher";
import { apiClient } from "@/lib/api/client";
import { reportsApi } from "@/services/api/reports.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { GraduationCap, CheckCircle2, PlusCircle, Download, XCircle, Edit3 } from "lucide-react";

export default function ExamControllerDashboardPage() {
  const qc = useQueryClient();
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState<"MID_SEM" | "END_SEM" | "INTERNAL" | "PRACTICAL" | "VIVA">("MID_SEM");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [roomId, setRoomId] = useState("");
  const [gradingSchemeId, setGradingSchemeId] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [passMarks, setPassMarks] = useState("40");

  // Marks moderation modal state
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [marksSheet, setMarksSheet] = useState<Array<{ studentId: string; rollNumber: string; name: string; marksObtained: number }>>([]);
  const [editReason, setEditReason] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [examStatusFilter, setExamStatusFilter] = useState("");

  // Create Grading Scheme modal state
  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [schemeName, setSchemeName] = useState("Standard 10-Point Grade Scale");
  const [schemeDefault, setSchemeDefault] = useState(true);
  const [schemeBandsJson, setSchemeBandsJson] = useState(
    "A+:90-100:10, A:80-89:9, B+:70-79:8, B:60-69:7, C:50-59:6, D:40-49:5, F:0-39:0",
  );

  const { data: exams = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["exam-controller-list"],
    queryFn: () => examsApi.list(),
  });

  const { data: offerings = [] } = useQuery({
    queryKey: ["exam-controller-offerings"],
    queryFn: () => apiClient<any[]>("/subject-offerings"),
  });

  const { data: schemes = [] } = useQuery({
    queryKey: ["exam-grading-schemes"],
    queryFn: () => examsApi.listGradingSchemes(),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["exam-controller-rooms"],
    queryFn: () => apiClient<any[]>("/timetable/rooms").catch(() => []),
  });

  const { isLoading: loadingMarks } = useQuery({
    queryKey: ["exam-controller-marks", editingExam?.id],
    enabled: !!editingExam,
    queryFn: async () => {
      if (!editingExam) return [];
      const existing = await examsApi.getResults(editingExam.id).catch(() => []);
      if (existing.length > 0) {
        setMarksSheet(
          existing.map((r) => ({
            studentId: r.studentId,
            rollNumber: r.student?.rollNumber || "ID",
            name: r.student?.user ? `${r.student.user.firstName} ${r.student.user.lastName}` : "Student",
            marksObtained: Number(r.marksObtained ?? 0),
          })),
        );
      } else if (editingExam.subjectOfferingId) {
        const roster = await teacherApi.getClassRoster(editingExam.subjectOfferingId).catch(() => []);
        setMarksSheet(
          roster.map((s) => ({
            studentId: s.id,
            rollNumber: s.rollNumber || "ID",
            name: s.name || "Student",
            marksObtained: 0,
          })),
        );
      } else {
        setMarksSheet([]);
      }
      return existing;
    },
  });

  const createExam = useMutation({
    mutationFn: () =>
      examsApi.create({
        subjectOfferingId: selectedOfferingId,
        type: examType,
        title: examTitle.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Math.max(5, Math.min(600, Number(durationMinutes) || 180)),
        maxMarks: Number(maxMarks),
        passMarks: Number(passMarks),
        roomId: roomId || undefined,
        gradingSchemeId: gradingSchemeId || undefined,
      }),
    onSuccess: () => {
      toast.success("Examination scheduled successfully");
      setExamTitle("");
      qc.invalidateQueries({ queryKey: ["exam-controller-list"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to schedule exam"),
  });

  const publishExam = useMutation({
    mutationFn: (examId: string) => examsApi.publishResults(examId),
    onSuccess: () => {
      toast.success("Draft results published and CGPA recalculated");
      qc.invalidateQueries({ queryKey: ["exam-controller-list"] });
    },
    onError: (err: any) => toast.error(err?.message || "No draft results ready to publish"),
  });

  const cancelExam = useMutation({
    mutationFn: (examId: string) => examsApi.cancel(examId),
    onSuccess: () => {
      toast.success("Examination marked CANCELLED");
      qc.invalidateQueries({ queryKey: ["exam-controller-list"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to cancel exam"),
  });

  const saveMarks = useMutation({
    mutationFn: () => {
      if (!editingExam) throw new Error("No exam selected");
      return examsApi.enterResults(
        editingExam.id,
        marksSheet.map((m) => ({ studentId: m.studentId, marksObtained: Number(m.marksObtained) })),
        editReason.trim() || undefined,
      );
    },
    onSuccess: () => {
      toast.success("Examination marks saved (audited)");
      setEditingExam(null);
      setEditReason("");
      qc.invalidateQueries({ queryKey: ["exam-controller-list"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save marks"),
  });

  const createScheme = useMutation({
    mutationFn: () => {
      const bands = schemeBandsJson
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((entry) => {
          const [grade, range, pts] = entry.split(":").map((x) => x.trim());
          const [min, max] = (range || "0-0").split("-").map(Number);
          return { grade, min, max, points: Number(pts) };
        });
      if (!bands.length || bands.some((b) => !b.grade || Number.isNaN(b.min) || Number.isNaN(b.max) || Number.isNaN(b.points))) {
        throw new Error("Invalid grade band format. Use Grade:min-max:points separated by commas.");
      }
      return examsApi.createGradingScheme({
        name: schemeName.trim(),
        bands,
        isDefault: schemeDefault,
      });
    },
    onSuccess: () => {
      toast.success("Grading scheme created");
      setSchemeModalOpen(false);
      qc.invalidateQueries({ queryKey: ["exam-grading-schemes"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create grading scheme"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Examination Hub Unavailable" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Examination Controller Workbench
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Schedule examinations, oversee grading schemes, moderate marks, and publish official transcripts.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() =>
            reportsApi.downloadCsv("performance").catch((err: any) =>
              toast.error(err?.message || "Failed to export result CSV"),
            )
          }
        >
          <Download className="h-3.5 w-3.5" /> Export Result Sheet CSV
        </Button>
      </div>

      {/* Schedule Exam Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-brand-600" />
            Schedule Examination
          </CardTitle>
          <CardDescription>Create a conflict-checked exam slot for an active subject offering.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedOfferingId || !examTitle.trim() || !scheduledAt) {
                toast.error("Please fill subject offering, title, and date/time");
                return;
              }
              createExam.mutate();
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            <select
              value={selectedOfferingId}
              onChange={(e) => setSelectedOfferingId(e.target.value)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs"
            >
              <option value="">Select Subject Offering...</option>
              {offerings.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.subject?.code} — {o.subject?.name} ({o.section?.name})
                </option>
              ))}
            </select>

            <Input
              placeholder="Exam Title (e.g. End Semester Dec 2026)"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
            />

            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs"
            >
              <option value="MID_SEM">MID_SEM</option>
              <option value="END_SEM">END_SEM</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="PRACTICAL">PRACTICAL</option>
              <option value="VIVA">VIVA</option>
            </select>

            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />

            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                min={5}
                max={600}
                placeholder="Duration (min)"
                title="Duration in minutes"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max Marks"
                title="Maximum marks"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Pass Marks"
                title="Passing marks"
                value={passMarks}
                onChange={(e) => setPassMarks(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                aria-label="Exam Room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-border bg-background px-2 text-xs"
              >
                <option value="">Room (Optional)</option>
                {rooms.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.code} ({r.capacity} cap)
                  </option>
                ))}
              </select>
              <select
                aria-label="Grading Scheme"
                value={gradingSchemeId}
                onChange={(e) => setGradingSchemeId(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-border bg-background px-2 text-xs"
              >
                <option value="">Default Grading</option>
                {schemes.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button type="submit" isLoading={createExam.isPending} className="shrink-0 text-xs">
                Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active & Scheduled Exams */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            Scheduled Examinations ({exams.length})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Filter exam title or code..."
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              className="w-48 h-8 text-xs"
            />
            <select
              aria-label="Filter exam status"
              value={examStatusFilter}
              onChange={(e) => setExamStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {exams.filter((ex: any) => {
            const matchStatus = !examStatusFilter || ex.status === examStatusFilter;
            const matchQ =
              !examSearch.trim() ||
              (ex.title || "").toLowerCase().includes(examSearch.toLowerCase()) ||
              (ex.subjectOffering?.subject?.code || "").toLowerCase().includes(examSearch.toLowerCase());
            return matchStatus && matchQ;
          }).length === 0 ? (
            <p className="text-xs text-muted-foreground">No matching examinations found.</p>
          ) : (
            exams
              .filter((ex: any) => {
                const matchStatus = !examStatusFilter || ex.status === examStatusFilter;
                const matchQ =
                  !examSearch.trim() ||
                  (ex.title || "").toLowerCase().includes(examSearch.toLowerCase()) ||
                  (ex.subjectOffering?.subject?.code || "").toLowerCase().includes(examSearch.toLowerCase());
                return matchStatus && matchQ;
              })
              .map((exam: any) => (
              <div
                key={exam.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{exam.title}</span>
                    <Badge variant="outline">{exam.type}</Badge>
                    <Badge variant={exam.status === "CANCELLED" ? "destructive" : exam.status === "COMPLETED" ? "default" : "secondary"}>
                      {exam.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {exam.subjectOffering?.subject?.code} {exam.subjectOffering?.subject?.name}
                    {exam.subjectOffering?.section?.name ? ` • Sec ${exam.subjectOffering.section.name}` : ""}
                    {exam.subjectOffering?.semester?.number ? ` (Sem ${exam.subjectOffering.semester.number})` : ""} •{" "}
                    {new Date(exam.scheduledAt).toLocaleString()} • {exam.durationMinutes} min •{" "}
                    {exam.room?.code ? `Room ${exam.room.code} • ` : ""}Max {Number(exam.maxMarks)} (Pass {Number(exam.passMarks)})
                  </p>
                </div>
                {exam.status !== "CANCELLED" && (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingExam(exam)}
                      className="gap-1 text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Enter / Moderate Marks
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => publishExam.mutate(exam.id)}
                      isLoading={publishExam.isPending}
                      className="gap-1 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Publish Drafts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelExam.mutate(exam.id)}
                      isLoading={cancelExam.isPending}
                      className="gap-1 text-xs text-rose-600"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Grading Schemes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Institutional Grading Schemes ({schemes.length})</CardTitle>
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setSchemeModalOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" /> New Grading Scheme
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {schemes.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between font-semibold">
                <span>{s.name}</span>
                {s.isDefault && <Badge>Default</Badge>}
              </div>
              <p className="text-muted-foreground mt-1">
                {Array.isArray(s.bands) ? `${s.bands.length} grade bands configured` : "Configured"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Enter / Moderate Marks Dialog */}
      <Dialog
        isOpen={!!editingExam}
        onClose={() => setEditingExam(null)}
        title={editingExam ? `Marks Sheet: ${editingExam.title}` : "Marks Sheet"}
        description="Modifying already-published marks requires an audit reason."
      >
        {loadingMarks ? (
          <Skeleton className="h-40 w-full" />
        ) : marksSheet.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">No enrolled student records found for this exam.</p>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="max-h-64 overflow-y-auto divide-y divide-border border rounded-xl">
              {marksSheet.map((row, idx) => (
                <div key={row.studentId} className="flex items-center justify-between px-3 py-2 gap-2">
                  <div>
                    <div className="font-semibold">{row.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{row.rollNumber}</div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={Number(editingExam?.maxMarks ?? 100)}
                    value={row.marksObtained}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMarksSheet((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, marksObtained: val } : item)),
                      );
                    }}
                    className="w-24 h-8 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
            <Input
              placeholder="Audit reason (required when moderating published marks)"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingExam(null)}>Cancel</Button>
              <Button size="sm" isLoading={saveMarks.isPending} onClick={() => saveMarks.mutate()}>
                Save Marks (Draft)
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create Grading Scheme Dialog */}
      <Dialog
        isOpen={schemeModalOpen}
        onClose={() => setSchemeModalOpen(false)}
        title="Define Institutional Grading Scheme"
        description="Bands must cover 0–100 without gaps or overlaps (format: Grade:min-max:points)."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createScheme.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <Input
            placeholder="Scheme Name"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
            required
          />
          <div>
            <label className="font-semibold block mb-1">Grade Bands (0–100 coverage)</label>
            <textarea
              rows={3}
              value={schemeBandsJson}
              onChange={(e) => setSchemeBandsJson(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 font-mono text-[11px]"
              required
            />
          </div>
          <label className="flex items-center gap-2 font-medium cursor-pointer">
            <input type="checkbox" checked={schemeDefault} onChange={(e) => setSchemeDefault(e.target.checked)} />
            Set as Default Institutional Scheme
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSchemeModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={createScheme.isPending}>Create Scheme</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
