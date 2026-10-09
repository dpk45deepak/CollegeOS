"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth/authStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  Sparkles,
  CalendarCheck2,
  CalendarDays,
  FileText,
  GraduationCap,
  Award,
  CreditCard,
  Gift,
  Briefcase,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();
  const { setCopilotOpen } = useUIStore();

  const studentName = user?.name?.split(" ")[0] || "Deepak";

  return (
    <div className="space-y-6">
      {/* Top Personal Assistant Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            Good morning, {studentName} <span className="inline-block animate-wave">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Here&apos;s your personalized agenda and items requiring attention today.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setCopilotOpen(true)}
            className="text-xs gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask College AI
          </Button>
          <Link href="/student/timetable">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Full Timetable
            </Button>
          </Link>
        </div>
      </div>

      {/* Intelligent Priority Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Attendance Alert Card */}
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Attendance Warning
              </span>
              <span className="text-xs font-mono font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                71.1%
              </span>
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              DBMS (CS601) Below 75%
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              You need <strong>3 consecutive classes</strong> to restore examination eligibility.
            </p>
          </div>
          <Link
            href="/student/attendance"
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            Open Recovery Calculator <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 2. Assignment Countdown Card */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Due in 28 Hours
              </span>
              <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                25 Marks
              </span>
            </div>
            <h4 className="text-xs font-semibold text-foreground truncate">
              B+ Tree Indexing Simulation
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Course CS601 • Dr. Vikram Sharma. Final submission deadline tomorrow at 11:59 PM.
            </p>
          </div>
          <Link
            href="/student/assignments"
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            Submit Assignment <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 3. Upcoming Exam Card */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                Mid-Term Exam
              </span>
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                Oct 16
              </span>
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              Database Systems (CS601)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              10:00 AM – Hall 4 (Desk 42) • Hall Ticket allocated & verified.
            </p>
          </div>
          <Link
            href="/student/exams"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View Seating & Syllabus <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 4. Placement & Fee Alerts Card */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col justify-between space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Placement Deadline
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                Closes Today
              </span>
            </div>
            <h4 className="text-xs font-semibold text-foreground">
              TCS Prime (11.5 LPA)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Your profile has a <strong>96% match</strong>. Applications close at 11:59 PM.
            </p>
          </div>
          <Link
            href="/student/placements"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            1-Click Apply Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Student Quick Actions Bar */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Academic Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[
            { label: "Safe-Bunk Calc", href: "/student/attendance", icon: CalendarCheck2, color: "text-rose-500" },
            { label: "Today's Schedule", href: "/student/timetable", icon: CalendarDays, color: "text-blue-500" },
            { label: "Assignments", href: "/student/assignments", icon: FileText, color: "text-amber-500" },
            { label: "Exams & Seating", href: "/student/exams", icon: GraduationCap, color: "text-indigo-500" },
            { label: "Results & SGPA", href: "/student/results", icon: Award, color: "text-emerald-500" },
            { label: "Pending Fees", href: "/student/fees", icon: CreditCard, color: "text-purple-500" },
            { label: "Scholarships", href: "/student/scholarships", icon: Gift, color: "text-pink-500" },
            { label: "Placements", href: "/student/placements", icon: Briefcase, color: "text-teal-500" },
            { label: "Raise Grievance", href: "/student/complaints", icon: AlertCircle, color: "text-orange-500" },
            { label: "College Bylaws", href: "/documents", icon: Sparkles, color: "text-brand-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/60 transition-all group"
              >
                <Icon className={`h-4 w-4 ${item.color} shrink-0`} />
                <span className="text-xs font-medium text-foreground truncate group-hover:text-brand-600 transition-colors">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Today's Classes & AI Insight Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                Today&apos;s Class Schedule (Monday)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current Time: 10:15 AM • Highlighted active lecture
              </p>
            </div>
            <Link
              href="/student/timetable"
              className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
            >
              Full Week <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                time: "09:00 AM - 10:15 AM",
                subject: "Database Management Systems (CS601)",
                room: "LT-204",
                teacher: "Dr. Vikram Sharma",
                status: "COMPLETED",
              },
              {
                time: "10:30 AM - 11:45 AM",
                subject: "Operating Systems Internals (CS602)",
                room: "LT-204",
                teacher: "Prof. Ananya Iyer",
                status: "UP_NEXT",
              },
              {
                time: "01:00 PM - 02:15 PM",
                subject: "Machine Learning & Neural Nets (CS603)",
                room: "Auditorium-2",
                teacher: "Dr. Alok Verma",
                status: "SCHEDULED",
              },
              {
                time: "02:30 PM - 04:30 PM",
                subject: "DBMS & Cloud Systems Lab (CS606)",
                room: "Lab 3B",
                teacher: "Dr. Vikram Sharma",
                status: "SCHEDULED",
              },
            ].map((slot, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                  slot.status === "UP_NEXT"
                    ? "bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 shadow-xs"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-xs font-mono font-semibold text-muted-foreground shrink-0 w-36">
                    {slot.time}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {slot.subject}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {slot.room} • {slot.teacher}
                    </p>
                  </div>
                </div>

                <div>
                  {slot.status === "COMPLETED" && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Attended
                    </span>
                  )}
                  {slot.status === "UP_NEXT" && (
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-100 dark:bg-brand-900 px-2.5 py-1 rounded-full animate-pulse">
                      Starting in 15m
                    </span>
                  )}
                  {slot.status === "SCHEDULED" && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Performance Advisor Card */}
        <div className="space-y-4">
          <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20 dark:bg-purple-950/10">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Academic Advisor
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-0.5 rounded-full font-medium">
                  Verified Model
                </span>
              </div>
              <CardTitle className="text-sm font-bold text-foreground mt-1">
                Semester 6 Trajectory: 8.7+ CGPA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                Your practical lab performance is in the <strong>top 5%</strong> of the CSE batch. However, your attendance margin in DBMS is critically tight.
              </p>
              <div className="p-2.5 rounded-lg bg-card border border-border space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  AI Recommendation
                </span>
                <p className="text-[11px] text-foreground font-medium">
                  Attend today&apos;s Lab 3B and Wednesday&apos;s lecture to push DBMS attendance to 73.5%.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopilotOpen(true)}
                className="w-full text-xs gap-1.5"
              >
                Chat with Copilot <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Pending Fee Mini Widget */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Semester 6 Dues
                </span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                  Due Oct 25
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold text-foreground">₹12,500</span>
                <span className="text-[11px] text-muted-foreground">of ₹92,500</span>
              </div>
              <Link href="/student/fees" className="block">
                <Button size="sm" variant="subtle" className="w-full text-xs">
                  Pay Now Without Queue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
