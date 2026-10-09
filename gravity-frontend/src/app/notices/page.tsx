"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  Bell,
  Download,
  FileText,
  AlertTriangle,
  Calendar,
  Building,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function NoticesPage() {
  const { data: notices, isLoading } = useQuery({
    queryKey: ["all_notices"],
    queryFn: () => studentApi.getNotices(),
  });

  const [filter, setFilter] = useState<"ALL" | "URGENT" | "HIGH">("ALL");

  if (isLoading || !notices) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const filtered = notices.filter((n) => {
    if (filter === "ALL") return true;
    return n.priority === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Official Campus Notices & Bulletins
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified circulars from the Dean&apos;s Office, Examination Cell, and Student Affairs.
          </p>
        </div>

        <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground">
          {(["ALL", "URGENT", "HIGH"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filter === tab
                  ? "bg-background text-foreground shadow-xs"
                  : "hover:text-foreground"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((notice) => {
          const isUrgent = notice.priority === "URGENT";
          const isHigh = notice.priority === "HIGH";

          return (
            <Card
              key={notice.id}
              className={`hover:shadow-md transition-shadow ${
                isUrgent ? "border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10" : ""
              }`}
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-brand-500" />
                      {notice.department}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : isHigh
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>

                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(notice.date)}
                  </span>
                </div>

                <CardTitle className="text-sm font-bold text-foreground mt-2">
                  {notice.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {notice.content}
                </p>

                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {notice.attachments.map((file, i) => (
                      <button
                        key={i}
                        onClick={() => alert(`Downloading official PDF: ${file.name}`)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-xs text-foreground font-medium transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-brand-600" />
                        <span>{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">({file.size})</span>
                        <Download className="h-3 w-3 text-muted-foreground ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
