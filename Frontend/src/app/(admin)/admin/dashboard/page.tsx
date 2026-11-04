"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Users,
  Briefcase,
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminDashboardPage() {
  const { data: triageMetrics, isLoading, error, refetch } = useQuery({
    queryKey: ["admin_attention_metrics"],
    queryFn: () => adminApi.getAttentionMetrics(),
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  if (error || !triageMetrics) {
    return (
      <ErrorState
        message="Could not load executive attention metrics. Please verify backend connection."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Registrar & Executive Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-0.5">
            What Needs Attention Today
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time campus triage: attendance debarments, unpaid fee collections, pending grievances, and active placements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/analytics">
            <Button size="sm" className="text-xs gap-1.5 shadow-md shadow-brand-500/20">
              <BarChart3 className="h-4 w-4" /> Full Executive Analytics
            </Button>
          </Link>
          <Link href="/admin/ai-observability">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600" /> AI Observability
            </Button>
          </Link>
        </div>
      </div>

      {/* Triage Alert Feed */}
      {triageMetrics.length === 0 ? (
        <div className="p-12 text-center border rounded-2xl border-dashed border-border bg-card space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-foreground">All Campus Systems Nominal</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            No critical attendance shortages, overdue fee invoices, or escalated grievances require immediate administrator triage today.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {triageMetrics.map((item) => {
            const isHigh = item.severity === "high";

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between hover:shadow-md transition-shadow ${
                  isHigh ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10" : ""
                }`}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isHigh
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      Action Required
                    </span>
                  </div>

                  <div className="text-2xl font-extrabold text-foreground font-mono mt-2">
                    {item.category === "Finance"
                      ? `₹${(item.count || 0).toLocaleString("en-IN")}`
                      : (item.count ?? 0)}
                  </div>

                  <CardTitle className="text-sm font-bold text-foreground mt-1">
                    {item.label}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <Link
                      href={item.actionUrl}
                      className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      {item.actionText} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
