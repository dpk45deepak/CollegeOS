"use client";

import React from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api/student";
import {
  User,
  GraduationCap,
  Shield,
  Award,
  BookOpen,
  Mail,
  Phone,
  Laptop,
  CheckCircle2,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data: dashboard } = useQuery({
    queryKey: ["profile_student_dashboard"],
    queryFn: () => studentApi.getDashboard(),
    enabled: user?.role === "STUDENT",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Institutional Identity & Credentials
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Master institutional profile verified by the Office of Academic Affairs.
        </p>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/25">
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{user?.name || "Institutional User"}</h2>
            <span className="text-[10px] font-mono font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-2 py-0.5 rounded">
              {user?.role}
            </span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-semibold">
              Verified Session
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {user?.department || "Academic Department"} • Institutional Identifier: {user?.rollNumber || user?.id}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {user?.email || "Email on File"}
            </span>
            {user?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Academic Info & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              Academic Standing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Primary Department:</span>
              <span className="font-semibold text-foreground">Computer Science & Engineering</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Assigned Role:</span>
              <span className="font-semibold text-foreground">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Institutional Short Code:</span>
              <span className="font-mono font-semibold text-foreground">SDIET</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Attendance Status:</span>
              <span className="font-mono font-bold text-emerald-600">
                {dashboard?.attendance?.overall?.percentage
                  ? `${dashboard.attendance.overall.percentage}% Verified`
                  : "Good Standing"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Institutional Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Authorized Workspaces
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Attendance Records",
                  "Lecture Schedules",
                  "Deliverable Submissions",
                  "Grievance Triage",
                  "AI College Copilot",
                  "Institutional Announcements",
                ].map((cap, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium text-[11px] border border-border"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Verification Authority
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Signed by Satyug Darshan Institute of Engineering and Technology (SDIET) Registrar & Academic Council.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Device Sessions */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-600" />
            Security & Authentication Session
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Laptop className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Authenticated Browser Session</span>
                <span className="text-[10px] text-emerald-600 ml-2 font-bold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                  JWT Active
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Secured with bearer token rotation & institutional RBAC policy.
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
