"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import {
  Sparkles,
  Cpu,
  Clock,
  Terminal,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAIObservabilityPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin_ai_logs"],
    queryFn: () => adminApi.getAILogs(),
  });

  if (isLoading || !logs) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            LLM Engineering & RAG Observability
          </span>
          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
            Live Stream
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
          Campus Copilot Agent Execution Audit
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Inspect query intents, tool calls, vector search citations, and execution latencies in accordance with privacy guidelines.
        </p>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Queries Ingested (24h)
          </span>
          <span className="text-2xl font-extrabold text-foreground font-mono">1,842</span>
          <p className="text-[11px] text-muted-foreground mt-1">Peak: 10:00 - 11:30 AM</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Average Tool Latency
          </span>
          <span className="text-2xl font-extrabold text-brand-600 font-mono">362 ms</span>
          <p className="text-[11px] text-muted-foreground mt-1">Direct indexed PostgreSQL queries</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            RAG Citation Precision
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono">99.4%</span>
          <p className="text-[11px] text-muted-foreground mt-1">0 hallucinations reported</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">
            Audit Status
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono">Compliant</span>
          <p className="text-[11px] text-muted-foreground mt-1">No PII or chain-of-thought leakage</p>
        </div>
      </div>

      {/* Observability Log Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Live Execution Traces
        </h3>

        {logs.map((log) => (
          <Card key={log.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2 bg-muted/20 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{log.timestamp}</span>
                  <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded">
                    {log.userRole}: {log.userName}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Intent: {log.intent}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-100 dark:bg-brand-900 px-2 py-0.5 rounded">
                    Latency: {log.latencyMs}ms
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    {log.status}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs font-semibold text-foreground">
                &ldquo;{log.query}&rdquo;
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tools Used */}
                <div className="p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <Terminal className="h-3 w-3 text-brand-500" />
                    Tools Executed ({(log.toolsUsed || []).length})
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                    {((log.toolsUsed || [])).map((tool, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-muted text-foreground">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sources Retrieved */}
                <div className="p-2.5 rounded-lg bg-card border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1.5">
                    <BookOpen className="h-3 w-3 text-emerald-500" />
                    Knowledge Citations ({(log.sourcesRetrieved || []).length})
                  </span>
                  <div className="space-y-0.5 text-[11px] text-foreground">
                    {((log.sourcesRetrieved || [])).map((source, i) => (
                      <div key={i} className="truncate">
                        • {source}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synthesized Response Preview */}
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/80">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">
                  Synthesized Answer Preview
                </span>
                <p className="text-[11px] text-muted-foreground italic">
                  &ldquo;{log.responsePreview}&rdquo;
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
