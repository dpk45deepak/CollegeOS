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
  LineChart,
  Line,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin_analytics"],
    queryFn: () => adminApi.getAnalyticsData(),
  });

  const [deptFilter, setDeptFilter] = useState("ALL");

  if (isLoading || !analytics) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
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
            <option value="ECE">Electronics</option>
            <option value="ME">Mechanical</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Exporting Executive Analytics PDF Summary...")}
            className="text-xs gap-1.5 h-8"
          >
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.attendanceByDept}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="department" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" name="Current %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Statutory (75%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.cgpaDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="bracket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" name="Student Count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Placement Offers & Complaint Resolution Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Offers */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Top Corporate Recruiters & Offers Rolled Out
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.placementStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="company" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="offers" name="Total Offers" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection Pie */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-sm font-bold">
              Semester 6 Tuition Fee Realization Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.feeCollectionStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics.feeCollectionStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
