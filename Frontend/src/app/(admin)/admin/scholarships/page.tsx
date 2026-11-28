"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  scholarshipsApi,
  ScholarshipItem,
  ScholarshipType,
  ScholarshipApplicationItem,
  CreateScholarshipDto,
} from "@/services/api/scholarships.api";
import { specialistApi } from "@/lib/api/specialist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Gift, Plus, Edit2, Users, CheckCircle2, XCircle, Banknote, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminScholarshipsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ScholarshipType>("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScholarshipItem | null>(null);

  const [sType, setSType] = useState<ScholarshipType>("COLLEGE");
  const [sName, setSName] = useState("");
  const [sProvider, setSProvider] = useState("");
  const [sAmount, setSAmount] = useState("");
  const [sDeadline, setSDeadline] = useState("");
  const [sMinCgpa, setSMinCgpa] = useState("");
  const [sEligibilityText, setSEligibilityText] = useState("");
  const [sRequiredDocs, setSRequiredDocs] = useState("Transcript, ID Card");
  const [sDescription, setSDescription] = useState("");
  const [sUrl, setSUrl] = useState("");
  const [sIsActive, setSIsActive] = useState(true);

  const [inspectSch, setInspectSch] = useState<ScholarshipItem | null>(null);

  const { data: scholarships = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin_scholarships", typeFilter, search],
    queryFn: () =>
      scholarshipsApi.list({
        type: typeFilter === "ALL" ? undefined : typeFilter,
        search: search.trim() || undefined,
        limit: 50,
      }),
  });

  const { data: applications = [], isLoading: appsLoading, refetch: refetchApps } = useQuery({
    queryKey: ["admin_scholarship_apps", inspectSch?.id],
    queryFn: () => specialistApi.listScholarshipApplications(inspectSch!.id),
    enabled: !!inspectSch?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const docs = sRequiredDocs
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const eligibility: Record<string, any> | undefined = sMinCgpa
        ? { minCgpa: Number(sMinCgpa) }
        : undefined;
      const dto: CreateScholarshipDto = {
        type: sType,
        name: sName.trim(),
        provider: sProvider.trim(),
        description: sDescription.trim() || undefined,
        eligibility,
        eligibilityText: sEligibilityText.trim() || undefined,
        requiredDocuments: docs,
        amount: sAmount ? Number(sAmount) : undefined,
        deadline: sDeadline ? new Date(sDeadline).toISOString() : undefined,
        url: sUrl.trim() || undefined,
        isActive: sIsActive,
      };
      if (editing) {
        return scholarshipsApi.update(editing.id, dto);
      }
      return scholarshipsApi.create(dto);
    },
    onSuccess: () => {
      toast.success(editing ? "Scholarship updated." : "Scholarship published.");
      setIsFormOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin_scholarships"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save scholarship"),
  });

  const decisionMutation = useMutation({
    mutationFn: ({
      scholarshipId,
      studentId,
      status,
    }: {
      scholarshipId: string;
      studentId: string;
      status: "APPROVED" | "REJECTED" | "DISBURSED";
    }) => scholarshipsApi.recordDecision(scholarshipId, studentId, status),
    onSuccess: (_, vars) => {
      toast.success(`Application marked ${vars.status}.`);
      refetchApps();
      qc.invalidateQueries({ queryKey: ["admin_scholarships"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to record decision"),
  });

  const openCreate = () => {
    setEditing(null);
    setSType("COLLEGE");
    setSName("");
    setSProvider("");
    setSAmount("");
    setSDeadline("");
    setSMinCgpa("");
    setSEligibilityText("");
    setSRequiredDocs("Transcript, ID Card");
    setSDescription("");
    setSUrl("");
    setSIsActive(true);
    setIsFormOpen(true);
  };

  const openEdit = (sch: ScholarshipItem) => {
    setEditing(sch);
    setSType(sch.type);
    setSName(sch.name);
    setSProvider(sch.provider);
    setSAmount(sch.amount != null ? String(sch.amount) : "");
    setSDeadline(sch.deadline ? String(sch.deadline).split("T")[0] : "");
    setSMinCgpa(sch.eligibility?.minCgpa != null ? String(sch.eligibility.minCgpa) : "");
    setSEligibilityText(sch.eligibilityText || "");
    setSRequiredDocs((sch.requiredDocuments || []).join(", "));
    setSDescription(sch.description || "");
    setSUrl(sch.url || "");
    setSIsActive(sch.isActive !== false);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }

  if (error) {
    return <ErrorState message="Could not load scholarships registry." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Scholarships Administration &amp; Disbursements
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create institutional &amp; government grant schemes, configure eligibility rules, and adjudicate applications.
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="text-xs gap-1.5 h-8">
          <Plus className="h-3.5 w-3.5" /> New Scholarship
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search scholarship name or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-3.5 w-3.5" />}
          />
        </div>
        <select
          aria-label="Filter by scholarship type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold w-full sm:w-auto"
        >
          <option value="ALL">All Categories</option>
          <option value="GOVERNMENT">Government</option>
          <option value="COLLEGE">College / Merit</option>
          <option value="PRIVATE">Private / Foundation</option>
        </select>
      </div>

      {/* Scholarships Grid */}
      {scholarships.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-2xl text-xs text-muted-foreground">
          No scholarships configured yet. Click &quot;New Scholarship&quot; to publish one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scholarships.map((sch) => (
            <Card key={sch.id} className="flex flex-col justify-between">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {sch.type}
                  </Badge>
                  <Badge variant={sch.isActive ? "default" : "secondary"} className="text-[10px]">
                    {sch.isActive ? "Active" : "Closed"}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-brand-600 shrink-0" />
                  <span>{sch.name}</span>
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">{sch.provider}</p>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3 text-xs">
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>
                    Grant:{" "}
                    <strong className="text-foreground">
                      {sch.amount != null ? `₹${Number(sch.amount).toLocaleString("en-IN")}` : "Variable"}
                    </strong>
                  </span>
                  {sch.deadline && (
                    <span>
                      Deadline:{" "}
                      <strong className="text-foreground font-mono">
                        {String(sch.deadline).split("T")[0]}
                      </strong>
                    </span>
                  )}
                  <span>
                    Applicants: <strong className="text-foreground">{sch._count?.applications ?? 0}</strong>
                  </span>
                </div>
                {sch.eligibilityText && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{sch.eligibilityText}</p>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(sch)} className="h-7 text-[11px] gap-1">
                    <Edit2 className="h-3 w-3" /> Edit
                  </Button>
                  <Button type="button" size="sm" onClick={() => setInspectSch(sch)} className="h-7 text-[11px] gap-1">
                    <Users className="h-3 w-3" /> Review Applicants
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Scholarship Modal */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit Scholarship — ${editing.name}` : "Publish New Scholarship"}
        description="Configure grant eligibility, required documents, and application deadline."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sName.trim() || !sProvider.trim()) return;
            saveMutation.mutate();
          }}
          className="space-y-3 text-xs max-h-[75vh] overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Type</label>
              <select
                value={sType}
                onChange={(e) => setSType(e.target.value as ScholarshipType)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="COLLEGE">College</option>
                <option value="GOVERNMENT">Government</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Grant Amount (INR)</label>
              <Input type="number" min="0" placeholder="e.g. 25000" value={sAmount} onChange={(e) => setSAmount(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Scholarship Name</label>
            <Input placeholder="e.g. Dean's Merit Scholarship 2026" value={sName} onChange={(e) => setSName(e.target.value)} required />
          </div>

          <div>
            <label className="font-semibold block mb-1">Provider / Funding Body</label>
            <Input placeholder="e.g. SDIET Trust / State Welfare Dept" value={sProvider} onChange={(e) => setSProvider(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Min CGPA (Optional)</label>
              <Input type="number" step="0.1" min="0" max="10" placeholder="e.g. 7.5" value={sMinCgpa} onChange={(e) => setSMinCgpa(e.target.value)} />
            </div>
            <div>
              <label className="font-semibold block mb-1">Deadline</label>
              <Input type="date" value={sDeadline} onChange={(e) => setSDeadline(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Required Documents (comma-separated)</label>
            <Input placeholder="Transcript, Income Certificate, ID Card" value={sRequiredDocs} onChange={(e) => setSRequiredDocs(e.target.value)} />
          </div>

          <div>
            <label className="font-semibold block mb-1">Eligibility Summary</label>
            <Input placeholder="e.g. CGPA >= 7.5 and attendance >= 80%" value={sEligibilityText} onChange={(e) => setSEligibilityText(e.target.value)} />
          </div>

          <div>
            <label className="font-semibold block mb-1">Official URL (Optional)</label>
            <Input type="url" placeholder="https://scholarships.gov.in/..." value={sUrl} onChange={(e) => setSUrl(e.target.value)} />
          </div>

          <div>
            <label className="font-semibold block mb-1">Description</label>
            <textarea
              rows={2}
              value={sDescription}
              onChange={(e) => setSDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-xs"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sIsActive} onChange={(e) => setSIsActive(e.target.checked)} className="rounded" />
            <span className="font-semibold">Active &amp; accepting applications</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={saveMutation.isPending}>
              {editing ? "Save Changes" : "Publish Scholarship"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Applicants & Decision Modal */}
      <Dialog
        isOpen={!!inspectSch}
        onClose={() => setInspectSch(null)}
        title={`Applicants — ${inspectSch?.name || ""}`}
        description="Adjudicate scholarship applications and record disbursement status."
      >
        <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto">
          {appsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : applications.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">No student applications or interest recorded yet.</p>
          ) : (
            (applications as ScholarshipApplicationItem[]).map((app: any) => {
              const stu = app.student;
              return (
                <div key={app.id} className="rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground">
                        {stu?.user ? `${stu.user.firstName} ${stu.user.lastName}` : app.studentId}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {stu?.rollNumber || ""} • {stu?.user?.email || ""}
                        {stu?.cgpa != null ? ` • CGPA ${Number(stu.cgpa).toFixed(2)}` : ""}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {app.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={decisionMutation.isPending}
                      onClick={() =>
                        decisionMutation.mutate({
                          scholarshipId: inspectSch!.id,
                          studentId: app.studentId,
                          status: "REJECTED",
                        })
                      }
                      className="h-7 text-[11px] text-rose-600 gap-1"
                    >
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={decisionMutation.isPending}
                      onClick={() =>
                        decisionMutation.mutate({
                          scholarshipId: inspectSch!.id,
                          studentId: app.studentId,
                          status: "APPROVED",
                        })
                      }
                      className="h-7 text-[11px] text-emerald-600 gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={decisionMutation.isPending}
                      onClick={() =>
                        decisionMutation.mutate({
                          scholarshipId: inspectSch!.id,
                          studentId: app.studentId,
                          status: "DISBURSED",
                        })
                      }
                      className="h-7 text-[11px] gap-1"
                    >
                      <Banknote className="h-3 w-3" /> Disbursed
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Dialog>
    </div>
  );
}
