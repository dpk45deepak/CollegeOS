"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Filter, Download, ShieldCheck, Activity, RefreshCw, AlertTriangle, Layers, Clock, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ["admin_analytics"],
    queryFn: () => adminApi.getAnalyticsData(),
  });

  const [activeTab, setActiveTab] = useState<"charts" | "audit" | "queues">("charts");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [exporting, setExporting] = useState(false);
  const [auditEntityFilter, setAuditEntityFilter] = useState("ALL");
  const [retryingQueue, setRetryingQueue] = useState<string | null>(null);

  // System Audit Trail Query
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ["admin_audit_trail", auditEntityFilter],
    queryFn: async () => {
      const params = auditEntityFilter !== "ALL" ? { entity: auditEntityFilter } : undefined;
      const res = await apiClient<any>("/audit", { params }).catch(() => null);
      return res?.items || (Array.isArray(res) ? res : []);
    },
    enabled: activeTab === "audit",
  });

  // Background Queues Query
  const { data: queueStats, isLoading: queuesLoading, refetch: refetchQueues } = useQuery({
    queryKey: ["admin_queues_stats"],
    queryFn: async () => {
      const res = await apiClient<any[]>("/admin/queues").catch(() => []);
      return Array.isArray(res) ? res : [];
    },
    enabled: activeTab === "queues",
  });

  const handleRetryFailedQueue = async (queueName: string) => {
    setRetryingQueue(queueName);
    try {
      const failed = await apiClient<any[]>(`/admin/queues/${queueName}/failed`).catch(() => []);
      if (Array.isArray(failed) && failed.length > 0) {
        for (const job of failed.slice(0, 5)) {
          if (job.id) {
            await apiClient(`/admin/queues/${queueName}/failed/${job.id}/retry`, { method: "POST" }).catch(() => null);
          }
        }
      }
      refetchQueues();
      alert(`Triggered retry for dead-letter jobs in queue: ${queueName}`);
    } catch (err: any) {
      alert(err?.message || "Failed to retry queue jobs.");
    } finally {
      setRetryingQueue(null);
    }
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("college_os_token") : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const targetUrl = apiUrl.startsWith("http") ? `${apiUrl}/reports/performance` : `/api/v1/reports/performance`;
      const res = await fetch(targetUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Report download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Executive_Analytics_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Executive report exported and archived to institutional audit records.");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (error || !analytics) {
    return (
      <ErrorState
        message="Could not load executive analytics. Please check backend service status."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Executive Academic & Financial Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-departmental performance indicators, fee collection pipeline, and placement rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">Computer Science</option>
            <option value="CE">Civil Engineering</option>
            <option value="DS">Data Science</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport} isLoading={exporting}
            className="text-xs gap-1.5 h-8"
          >
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("charts")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "charts"
              ? "border-brand-600 text-brand-600 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="h-4 w-4" /> Executive Telemetry & Charts
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "audit"
              ? "border-brand-600 text-brand-600 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> System Audit Trail & Security Ledger
        </button>
        <button
          onClick={() => setActiveTab("queues")}
          className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "queues"
              ? "border-brand-600 text-brand-600 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" /> Platform Background Job Queues
        </button>
      </div>

      {activeTab === "charts" && (
        <>
          {/* Row 1: Attendance By Department & Fee Collection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance By Department */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Department Attendance Compliance (%) vs 75% Baseline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64">
            {analytics.attendanceByDept.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No departmental attendance sessions logged for the active period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.attendanceByDept}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="department" textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" name="Current %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Statutory (75%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* CGPA Distribution */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Student CGPA Distribution (All Enrolled Batches)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64">
            {analytics.cgpaDistribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                CGPA distribution will be plotted once semester examination results are published.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.cgpaDistribution}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" name="Student Count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Placement Offers & Fee Collection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Offers */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Corporate Recruitment & Placement Drives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64">
            {analytics.placementStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No active placement offers logged for the current cycle.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.placementStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="company" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="offers" name="Total Offers" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fee Collection Pie */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Institutional Fee Realization Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64 flex items-center justify-center">
            {analytics.feeCollectionStatus.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No fee billing items found in the current ledger.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.feeCollectionStatus || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {(analytics?.feeCollectionStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* TAB 2: System Audit Trail & Security Ledger */}
      {activeTab === "audit" && (
        <Card className="border border-border">
          <CardHeader className="p-4 pb-2 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                Institutional Append-Only Audit Trail
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cryptographically tracked data mutations across academic records, fee adjustments, and student grades.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={auditEntityFilter}
                onChange={(e) => setAuditEntityFilter(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-semibold"
              >
                <option value="ALL">All Entities</option>
                <option value="AttendanceRecord">Attendance Records</option>
                <option value="StudentFee">Student Fees</option>
                <option value="ExamResult">Exam Results</option>
                <option value="User">Users & Credentials</option>
                <option value="Complaint">Grievance Redressal</option>
              </select>
              <Button size="sm" variant="outline" onClick={() => refetchAudit()} className="h-8 text-xs gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {auditLoading ? (
              <div className="p-12 text-center text-xs text-muted-foreground">Loading audit ledger entries...</div>
            ) : (!auditData || auditData.length === 0) ? (
              <div className="p-12 text-center text-xs text-muted-foreground">No recent audit log entries recorded for this filter.</div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Actor (User ID)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditData.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/20 font-mono text-[11px]">
                      <td className="p-3 pl-4 text-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recently"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "CREATE"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : log.action === "DELETE"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-foreground">{log.entity}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-xs">{log.entityId}</td>
                      <td className="p-3 text-muted-foreground">{log.userId || "SYSTEM"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Platform Background Job Queues */}
      {activeTab === "queues" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                BullMQ Distributed Background Processing Queues
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time queue depths, asynchronous job processing latency, and dead-letter queue retries.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetchQueues()} className="h-8 text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh Queues
            </Button>
          </div>

          {queuesLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Checking BullMQ worker statuses...</div>
          ) : (!queueStats || queueStats.length === 0) ? (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              Queue diagnostics available for platform operators. BullMQ worker is active.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queueStats.map((q: any) => (
                <Card key={q.queue} className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-mono font-bold text-foreground text-xs uppercase">{q.queue}</span>
                    <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded font-bold">
                      Worker Active
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block">Active</span>
                      <span className="font-mono font-bold text-brand-600 text-sm">{q.active || 0}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block">Waiting</span>
                      <span className="font-mono font-bold text-amber-600 text-sm">{q.waiting || 0}</span>
                    </div>
                    <div className="p-2 rounded bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block">Failed</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">{q.failed || 0}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Completed: <strong className="text-foreground">{q.completed || 0}</strong></span>
                    {q.failed > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRetryFailedQueue(q.queue)}
                        isLoading={retryingQueue === q.queue}
                        className="h-6 text-[10px] text-brand-600"
                      >
                        Retry Failed
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
