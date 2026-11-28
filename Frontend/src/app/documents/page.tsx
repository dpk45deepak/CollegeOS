"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import { apiDownload } from "@/lib/api/client";
import { aiApi } from "@/lib/api/ai";
import { documentsApi, DocumentType, DocumentVisibility } from "@/services/api/documents.api";
import { useDepartments } from "@/hooks/useAcademic";
import { useAuthStore } from "@/lib/auth/authStore";
import {
  Search,
  Sparkles,
  Download,
  Eye,
  Plus,
  Upload,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canUpload =
    user?.role === "ADMIN" ||
    user?.role === "COLLEGE_ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "TEACHER" ||
    user?.role === "HOD" ||
    user?.role === "LIBRARY_STAFF" ||
    user?.role === "PLACEMENT_OFFICER";

  const { data: documents, isLoading } = useQuery({
    queryKey: ["college_documents"],
    queryFn: () => studentApi.getDocuments(),
  });

  const { data: departments } = useDepartments();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isRAGOpen, setIsRAGOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [ragQuery, setRagQuery] = useState("What is the minimum attendance requirement?");
  const [ragMode, setRagMode] = useState<"ask" | "search">("ask");
  const [ragAnswer, setRagAnswer] = useState<{
    answer: string;
    source: string;
    page: number;
    clause: string;
    chunks?: Array<{ chunkId: string; title: string; page?: number; relevance: number; excerpt: string }>;
  } | null>(null);
  const [isAskingRAG, setIsAskingRAG] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<DocumentType>("SYLLABUS");
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>("PUBLIC");
  const [uploadDeptId, setUploadDeptId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !uploadTitle.trim()) {
        throw new Error("Please provide a title and select a file.");
      }
      return documentsApi.upload(uploadFile, {
        title: uploadTitle.trim(),
        documentType: uploadType,
        visibility: uploadVisibility,
        departmentId: uploadDeptId || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded and queued for indexing.");
      setIsUploadOpen(false);
      setUploadTitle("");
      setUploadDeptId("");
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ["college_documents"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to upload document.");
    },
  });

  const handleAskRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setIsAskingRAG(true);
    try {
      if (ragMode === "search") {
        const searchRes = await aiApi.searchKnowledge(ragQuery);
        const top = searchRes.results?.[0];
        setRagAnswer({
          answer:
            searchRes.results && searchRes.results.length > 0
              ? `Found ${searchRes.results.length} matching passage(s) (${searchRes.usedVector ? "vector" : "keyword"} retrieval).`
              : "No matching passages found in indexed college documents.",
          source: top?.title || "SDIET Knowledge Base",
          page: top?.page || 1,
          clause: top?.excerpt || "",
          chunks: searchRes.results || [],
        });
      } else {
        const res = await aiApi.askKnowledge(ragQuery);
        const primaryCite = res.citations?.[0];
        setRagAnswer({
          answer: res.answer || "No verified policy matching your inquiry was found in the indexed repository.",
          source: primaryCite?.title || "SDIET Institutional Knowledge Base",
          page: primaryCite?.pageNumber || 1,
          clause: primaryCite?.snippet ? `Excerpt: "${primaryCite.snippet.slice(0, 100)}..."` : "Verified Institutional Record",
        });
      }
    } catch {
      toast.error("Failed to query knowledge base. The AI assistant service may be unreachable or indexing documents.");
      setRagAnswer(null);
    } finally {
      setIsAskingRAG(false);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    setDownloadingDocId(doc.id);
    try {
      const safeFilename = `${String(doc?.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      await apiDownload(`/documents/${doc.id}/download`, safeFilename);
    } catch (err: any) {
      toast.error(err?.message || `Failed to download official document for ${doc?.title || "document"}.`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  if (isLoading || !documents) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const q = (search || "").toLowerCase().trim();
  const cat = (categoryFilter || "ALL").toLowerCase();
  const filtered = (documents || []).filter((doc) => {
    if (!doc) return false;
    const title = String(doc.title || "").toLowerCase();
    const summary = String(doc.summary || (doc as any).description || "").toLowerCase();
    const docCat = String(doc.category || (doc as any).documentType || "").toLowerCase();
    const matchesSearch = !q || title.includes(q) || summary.includes(q);
    const matchesCat = cat === "all" || docCat === cat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            College Knowledge & Ordinance Repository
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Official academic policies, curriculum syllabi, grading ordinances, and forms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canUpload && (
            <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(true)} className="text-xs gap-1.5 h-8">
              <Upload className="h-3.5 w-3.5" /> Upload Document
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setIsRAGOpen(true);
              setRagAnswer(null);
            }}
            className="text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-md shadow-brand-500/20 h-8"
          >
            <Sparkles className="h-4 w-4" /> Ask College Knowledge (RAG)
          </Button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search policies, forms, or syllabi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-3.5 w-3.5" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="categoryFilter"
            aria-label="Filter documents by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs w-full sm:w-auto font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="SYLLABUS">Syllabus</option>
            <option value="REGULATION">Academic Regulation</option>
            <option value="ATTENDANCE_POLICY">Attendance Policy</option>
            <option value="EXAM_RULES">Exam Rules</option>
            <option value="SCHOLARSHIP">Scholarship Guidelines</option>
            <option value="FEE_POLICY">Fee Policy</option>
            <option value="HOSTEL_RULES">Hostel Rules</option>
            <option value="PLACEMENT_POLICY">Placement Policy</option>
            <option value="HANDBOOK">Student Handbook</option>
            <option value="CIRCULAR">Official Circular</option>
            <option value="NOTICE">Notice</option>
            <option value="DEPARTMENT">Department Guidelines</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-2xl bg-card text-xs text-muted-foreground">
          No documents match the current search or category filter.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((doc) => (
          <Card key={doc.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded">
                  {doc.category}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {doc.academicYear} • {doc.fileSize}
                </span>
              </div>

              <CardTitle className="text-sm font-bold text-foreground mt-2">
                {doc.title}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Authority: {typeof doc.department === "string" ? doc.department : (doc.department as any)?.code || (doc.department as any)?.name || "Academic Affairs"}
              </p>
            </CardHeader>

            <CardContent className="p-5 pt-0 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {doc.summary}
              </p>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(doc)}
                  className="text-xs gap-1.5 h-8"
                  disabled={downloadingDocId === doc.id}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadDocument(doc)}
                  className="text-xs gap-1.5 h-8"
                  disabled={downloadingDocId === doc.id}
                >
                  <Download className="h-3.5 w-3.5" /> {downloadingDocId === doc.id ? "Downloading..." : "Download PDF"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Upload Document Modal */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Knowledge Document"
        description="Uploaded documents are scanned, stored, and ingested into the vector RAG database for AI retrieval."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            uploadMutation.mutate();
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="font-semibold block mb-1">Document Title</label>
            <Input
              placeholder="e.g. Academic Ordinance & Examination Rules 2026-27"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold block mb-1">Document Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as DocumentType)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="SYLLABUS">Syllabus</option>
                <option value="REGULATION">Academic Regulation</option>
                <option value="ATTENDANCE_POLICY">Attendance Policy</option>
                <option value="EXAM_RULES">Exam Rules</option>
                <option value="SCHOLARSHIP">Scholarship Guidelines</option>
                <option value="FEE_POLICY">Fee Policy</option>
                <option value="HOSTEL_RULES">Hostel Rules</option>
                <option value="PLACEMENT_POLICY">Placement Policy</option>
                <option value="HANDBOOK">Student Handbook</option>
                <option value="CIRCULAR">Official Circular</option>
                <option value="NOTICE">Notice</option>
                <option value="DEPARTMENT">Department Guidelines</option>
                <option value="TIMETABLE_POLICY">Timetable Policy</option>
                <option value="STUDENT_RECORD">Student Record</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Visibility</label>
              <select
                value={uploadVisibility}
                onChange={(e) => setUploadVisibility(e.target.value as DocumentVisibility)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="PUBLIC">Public</option>
                <option value="STUDENTS">Students Only</option>
                <option value="TEACHERS">Teachers Only</option>
                <option value="STAFF">Staff Only</option>
                <option value="DEPARTMENT">Department Only</option>
                <option value="ROLE_RESTRICTED">Role Restricted</option>
                <option value="ADMIN_ONLY">Admin Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Department (Optional)</label>
            <select
              value={uploadDeptId}
              onChange={(e) => setUploadDeptId(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
            >
              <option value="">General / College-Wide</option>
              {(departments || []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">File (PDF, DOCX, TXT)</label>
            <Input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={uploadMutation.isPending} disabled={!uploadFile}>
              Upload Document
            </Button>
          </div>
        </form>
      </Dialog>

      {/* "Ask College Knowledge" RAG Dialog */}
      <Dialog
        isOpen={isRAGOpen}
        onClose={() => setIsRAGOpen(false)}
        title="Ask College Knowledge Base"
        description="Vector search across 2,400+ pages of institutional bylaws, ordinances, and academic regulations."
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setRagMode("ask")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                ragMode === "ask" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              AI Answer (RAG)
            </button>
            <button
              type="button"
              onClick={() => setRagMode("search")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                ragMode === "search" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Passage Search (Direct)
            </button>
          </div>
          <form onSubmit={handleAskRAG} className="space-y-2">
            <Input
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g. What is the minimum attendance requirement?"
            />
            <Button type="submit" size="sm" className="w-full text-xs gap-1.5" disabled={isAskingRAG}>
              <Sparkles className="h-3.5 w-3.5" />{" "}
              {isAskingRAG
                ? "Searching Vector Embeddings..."
                : ragMode === "search"
                ? "Search Raw Passages"
                : "Query Knowledge Base"}
            </Button>
          </form>

          {ragAnswer && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="text-foreground leading-relaxed font-medium">
                {ragAnswer.answer}
              </div>

              {ragAnswer.chunks && ragAnswer.chunks.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pt-2 border-t border-border/80">
                  {ragAnswer.chunks.map((c) => (
                    <div key={c.chunkId} className="p-2.5 rounded-lg bg-card border border-border text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-semibold text-brand-600">
                        <span>{c.title} {c.page ? `(Page ${c.page})` : ""}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{Math.round((c.relevance || 0) * 100)}%</span>
                      </div>
                      <div className="text-muted-foreground">{c.excerpt}</div>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="pt-2 border-t border-border/80 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Source Grounding:
                </span>
                <div className="p-2 rounded-lg bg-card border border-border text-[11px] space-y-0.5">
                  <div className="font-semibold text-brand-600">
                    {ragAnswer.source} (Page {ragAnswer.page})
                  </div>
                  <div className="text-muted-foreground">{ragAnswer.clause}</div>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
