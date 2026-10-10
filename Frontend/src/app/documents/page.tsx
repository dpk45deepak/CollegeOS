"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  BookOpen,
  Search,
  Sparkles,
  Download,
  FileText,
  Filter,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["college_documents"],
    queryFn: () => studentApi.getDocuments(),
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isRAGOpen, setIsRAGOpen] = useState(false);
  const [ragQuery, setRagQuery] = useState("What is the minimum attendance requirement?");
  const [ragAnswer, setRagAnswer] = useState<{
    answer: string;
    source: string;
    page: number;
    clause: string;
  } | null>(null);

  if (isLoading || !documents) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.summary.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || doc.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAskRAG = (e: React.FormEvent) => {
    e.preventDefault();
    setRagAnswer({
      answer:
        "The statutory minimum attendance requirement is strictly 75.0% in every individual course according to the Academic Regulations Ordinance. Falling below 75% results in automatic exam debarment.",
      source: "Academic Regulations & Evaluation Ordinance 2025-2027",
      page: 12,
      clause: "Clause 7.2 — Attendance & Debarment Protocol",
    });
  };

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

        <Button
          size="sm"
          onClick={() => {
            setIsRAGOpen(true);
            setRagAnswer(null);
          }}
          className="text-xs gap-1.5 bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-md shadow-brand-500/20"
        >
          <Sparkles className="h-4 w-4" /> Ask College Knowledge (RAG)
        </Button>
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs w-full sm:w-auto font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="Policy">Academic Policies</option>
            <option value="Curriculum">Curriculum & Lab Manuals</option>
            <option value="Form">Official Forms</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
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
                Authority: {doc.department}
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
                  onClick={() => alert(`Opening preview of document: ${doc.title}`)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => alert(`Downloading verified PDF: ${doc.title}`)}
                  className="text-xs gap-1.5 h-8"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* "Ask College Knowledge" RAG Dialog */}
      <Dialog
        isOpen={isRAGOpen}
        onClose={() => setIsRAGOpen(false)}
        title="Ask College Knowledge Base"
        description="Vector search across 2,400+ pages of institutional bylaws, ordinances, and academic regulations."
      >
        <div className="space-y-4 text-xs">
          <form onSubmit={handleAskRAG} className="space-y-2">
            <Input
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="e.g. What is the minimum attendance requirement?"
            />
            <Button type="submit" size="sm" className="w-full text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Query Knowledge Base
            </Button>
          </form>

          {ragAnswer && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
              <div className="text-foreground leading-relaxed font-medium">
                {ragAnswer.answer}
              </div>

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
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
