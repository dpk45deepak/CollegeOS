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
  Zap,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAIObservabilityPage() {
  const { data: usage, isLoading: isUsageLoading } = useQuery({
    queryKey: ["admin_ai_usage"],
    queryFn: () => adminApi.getAIUsage(7),
  });

  const { data: logs, isLoading: isLogsLoading } = useQuery({
    queryKey: ["admin_ai_logs"],
    queryFn: () => adminApi.getAILogs(),
  });

  const isLoading = isUsageLoading || isLogsLoading;

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const byModel = usage?.byModel || [];
  const totalCalls = byModel.reduce((acc, m) => acc + (m.calls || 0), 0);
  const avgLatency =
    byModel.length > 0 && totalCalls > 0
      ? Math.round(
          byModel.reduce(
            (acc, m) => acc + (m.avgLatencyMs || 0) * (m.calls || 0),
            0
          ) / totalCalls
        )
      : 0;

  const errorCount = usage?.errors || 0;
  const successRate =
    totalCalls > 0
      ? `${(((totalCalls - errorCount) / totalCalls) * 100).toFixed(1)}%`
      : "100%";

  const totalTokens = byModel.reduce(
    (acc, m) => acc + (m.promptTokens || 0) + (m.completionTokens || 0),
    0
  );

  const toolUseEntries = Object.entries(usage?.toolUse || {});

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            LLM Engineering & RAG Observability
          </span>
          <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold">
            Live Telemetry
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
          Campus Copilot Agent Execution Audit
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Inspect query intents, tool calls, vector search citations, and execution latencies in accordance with institutional privacy guidelines.
        </p>
      </div>

      {/* Aggregate Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Invocations (7d)
            </span>
            <Zap className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
            {totalCalls.toLocaleString()}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across registered LLM providers
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Average Latency
            </span>
            <Clock className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-2xl font-extrabold text-brand-600 font-mono mt-1 block">
            {avgLatency} ms
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            {avgLatency > 0 ? "Production response time" : "Telemetry idle"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Success Rate
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
            {successRate}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">
            {errorCount} error{errorCount === 1 ? "" : "s"} logged
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">
              Tokens Consumed
            </span>
            <Cpu className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
            {totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}
          </span>
          <p className="text-[11px] text-muted-foreground mt-1">Prompt + completion tokens</p>
        </div>
      </div>

      {/* Model & Tool Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model Breakdown */}
        <Card>
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-purple-600" />
              LLM Model Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {byModel.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No model calls recorded in current window.
              </p>
            ) : (
              <div className="space-y-3">
                {byModel.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">
                        {m.model || "default"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Provider: {m.provider} • Kind: {m.kind}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-foreground">
                        {m.calls} call{m.calls === 1 ? "" : "s"}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {m.avgLatencyMs}ms avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Execution Breakdown */}
        <Card>
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-brand-600" />
              Agent Tool Executions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {toolUseEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tool invocations recorded in current window.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {toolUseEntries.map(([toolName, count]) => (
                  <div
                    key={toolName}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs"
                  >
                    <span className="font-mono font-semibold text-foreground">
                      {toolName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-mono text-[10px] font-bold">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observability Log Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Execution Errors & Diagnostic Traces
        </h3>

        {!logs || logs.length === 0 ? (
          <div className="p-12 text-center border rounded-2xl border-dashed border-border bg-card text-xs text-muted-foreground">
            No agent execution errors logged in telemetry window.
          </div>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 bg-muted/20 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {log.timestamp}
                    </span>
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
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                      {log.status}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs font-semibold text-foreground">
                  &ldquo;{log.query}&rdquo;
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                {/* Error Preview */}
                <div className="p-2.5 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase block mb-1">
                    Diagnostic Details
                  </span>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {log.responsePreview}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
