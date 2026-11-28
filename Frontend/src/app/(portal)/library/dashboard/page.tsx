"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi, DocumentType, DocumentVisibility } from "@/services/api/documents.api";
import { aiApi } from "@/services/api/ai.api";
import { academicApi } from "@/services/api/academic.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { BookOpen, RefreshCw, Search, Trash2, Upload } from "lucide-react";

const DOC_TYPES: DocumentType[] = [
  "HANDBOOK",
  "REGULATION",
  "SYLLABUS",
  "ATTENDANCE_POLICY",
  "EXAM_RULES",
  "FEE_POLICY",
  "SCHOLARSHIP",
  "PLACEMENT_POLICY",
  "CIRCULAR",
  "OTHER",
];

const VISIBILITIES: DocumentVisibility[] = [
  "PUBLIC",
  "STUDENTS",
  "TEACHERS",
  "STAFF",
  "DEPARTMENT",
  "ADMIN_ONLY",
];

export default function LibraryDashboardPage() {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [ragResult, setRagResult] = useState<any>(null);
  const [docSearch, setDocSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<DocumentType>("HANDBOOK");
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>("PUBLIC");
  const [uploadDeptId, setUploadDeptId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: docs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["library-documents"],
    queryFn: () => documentsApi.list({ limit: 100 }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["library-departments"],
    queryFn: () => academicApi.listDepartments().catch(() => []),
  });

  const uploadDoc = useMutation({
    mutationFn: () => {
      if (!uploadFile || !uploadTitle.trim()) throw new Error("Title and file required");
      return documentsApi.upload(uploadFile, {
        title: uploadTitle.trim(),
        documentType: uploadType,
        visibility: uploadVisibility,
        departmentId: uploadDeptId || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded & queued for indexing");
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadFile(null);
      qc.invalidateQueries({ queryKey: ["library-documents"] });
    },
    onError: (err: any) => toast.error(err?.message || "Document upload failed"),
  });

  const updateVisibility = useMutation({
    mutationFn: ({ id, visibility }: { id: string; visibility: DocumentVisibility }) =>
      documentsApi.updateVisibility(id, { visibility }),
    onSuccess: () => {
      toast.success("Visibility updated");
      qc.invalidateQueries({ queryKey: ["library-documents"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update visibility"),
  });

  const deleteDoc = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      toast.success("Document removed from repository");
      qc.invalidateQueries({ queryKey: ["library-documents"] });
    },
    onError: (err: any) => toast.error(err?.message || "Delete failed"),
  });

  const reprocess = useMutation({
    mutationFn: (id: string) => documentsApi.reprocess(id),
    onSuccess: () => {
      toast.success("Document queued for re-indexing");
      qc.invalidateQueries({ queryKey: ["library-documents"] });
    },
    onError: (err: any) => toast.error(err?.message || "Reprocess failed"),
  });

  const runSearch = useMutation({
    mutationFn: () => aiApi.askKnowledge(question.trim()),
    onSuccess: (res) => setRagResult(res),
    onError: (err: any) => toast.error(err?.message || "Knowledge query failed"),
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
    return <ErrorState title="Library Knowledge Base Unavailable" onRetry={() => refetch()} />;
  }

  const filteredDocs = docs.filter((doc: any) => {
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesSearch =
      !docSearch.trim() ||
      (doc.title || "").toLowerCase().includes(docSearch.toLowerCase()) ||
      (doc.documentType || "").toLowerCase().includes(docSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Library &amp; Academic Knowledge Curation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Upload, curate visibility, monitor chunk indexing, and verify handbook retrieval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="text-xs gap-1.5" onClick={() => setIsUploadOpen(true)}>
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </Button>
          <Link href="/documents">
            <Button size="sm" variant="outline" className="text-xs">Public Repository</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-brand-600" />
            Verify Indexed Knowledge Retrieval
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) runSearch.mutate();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Test a handbook or ordinance question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button type="submit" size="sm" isLoading={runSearch.isPending}>
              Query Index
            </Button>
          </form>
          {ragResult && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-2">
              <p className="leading-relaxed">{ragResult.answer}</p>
              {ragResult.citations?.length > 0 && (
                <div className="text-[11px] text-muted-foreground">
                  Citations: {ragResult.citations.map((c: any) => c.label || c.title).join(" • ")}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Institutional Documents ({filteredDocs.length})
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search title or type..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-48 h-8 text-xs"
            />
            <select
              aria-label="Filter document status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="READY">READY</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="UPLOADED">UPLOADED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs">
          {filteredDocs.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center">No matching documents in repository.</p>
          ) : (
            filteredDocs.map((doc: any) => (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div>
                  <div className="font-semibold">{doc.title}</div>
                  <div className="text-muted-foreground mt-0.5">
                    {doc.documentType} • {doc.chunkCount ?? 0} chunks • {doc.academicYear || "All years"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Visibility for ${doc.title}`}
                    value={doc.visibility}
                    onChange={(e) => updateVisibility.mutate({ id: doc.id, visibility: e.target.value as DocumentVisibility })}
                    className="h-7 rounded-lg border border-border bg-background px-2 text-[11px]"
                  >
                    {VISIBILITIES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <Badge variant={doc.status === "FAILED" ? "destructive" : doc.status === "READY" ? "default" : "secondary"}>
                    {doc.status}
                  </Badge>
                  {doc.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] gap-1"
                      onClick={() => reprocess.mutate(doc.id)}
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-rose-600"
                    onClick={() => deleteDoc.mutate(doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Knowledge Base Document"
        description="Index PDF/DOCX/TXT ordinances, syllabi, or handbooks for campus search."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!uploadTitle.trim() || !uploadFile) return;
            uploadDoc.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <Input placeholder="Document Title *" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value as DocumentType)} className="h-9 rounded-lg border border-border bg-background px-2">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={uploadVisibility} onChange={(e) => setUploadVisibility(e.target.value as DocumentVisibility)} className="h-9 rounded-lg border border-border bg-background px-2">
              {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {uploadVisibility === "DEPARTMENT" && (
            <select value={uploadDeptId} onChange={(e) => setUploadDeptId(e.target.value)} className="w-full h-9 rounded-lg border border-border bg-background px-2">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
            </select>
          )}
          <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required className="block w-full text-xs" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={uploadDoc.isPending}>Upload &amp; Index</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
