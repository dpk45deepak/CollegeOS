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
    <div className="space-y-6 select-none">
      {/* Top Personal Assistant Greeting */}
      <div className="clay-card p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0_var(--text)]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-mint)] border-2 border-[var(--text)] text-xs font-bold text-[var(--text)] mb-2 shadow-[1px_1px_0_var(--text)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--cta-dark)]" />
            <span>Apex College AI Assistant Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[var(--text)] tracking-tight flex items-center gap-2">
            Good morning, {studentName}! <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[var(--text-muted)] mt-1">
            Here&apos;s your live agenda, attendance recovery calculator, and upcoming academic deadlines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCopilotOpen(true)}
            className="btn-primary text-xs py-2.5 px-5 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Ask College AI
          </button>
          <Link href="/student/timetable">
            <button className="btn-secondary text-xs py-2.5 px-5 gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Timetable
            </button>
          </Link>
        </div>
      </div>

      {/* Intelligent Priority Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Attendance Alert Card */}
        <div className="clay-card p-5 bg-[var(--primary)]/20 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Attendance Alert
              </span>
              <span className="text-xs font-mono font-bold text-rose-700 bg-white border-2 border-rose-500 px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                71.1%
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)]">
              DBMS (CS601) Below 75%
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              You need <strong>3 consecutive classes</strong> to restore examination eligibility.
            </p>
          </div>
          <Link
            href="/student/attendance"
            className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
          >
            Open Recovery Calculator <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 2. Assignment Countdown Card */}
        <div className="clay-card p-5 bg-[var(--secondary)]/20 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-amber-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Due in 28 Hours
              </span>
              <span className="text-xs font-bold font-display bg-white border-2 border-[var(--text)] text-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                25 Marks
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)] truncate">
              B+ Tree Indexing Sim
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              Course CS601 • Dr. Vikram Sharma. Submission deadline tomorrow at 11:59 PM.
            </p>
          </div>
          <Link
            href="/student/assignments"
            className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            Submit Assignment <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 3. Upcoming Exam Card */}
        <div className="clay-card p-5 bg-[var(--accent-purple)]/30 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-purple-800 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                Mid-Term Exam
              </span>
              <span className="text-xs font-bold font-display bg-white border-2 border-[var(--text)] text-[var(--text)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                Oct 16
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)]">
              Database Systems (CS601)
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              10:00 AM – Hall 4 (Desk 42) • Hall Ticket verified and downloadable.
            </p>
          </div>
          <Link
            href="/student/exams"
            className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
          >
            View Seating & Hall Ticket <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 4. Placement & Fee Alerts Card */}
        <div className="clay-card p-5 bg-[var(--accent-mint)]/30 flex flex-col justify-between space-y-4 shadow-[4px_4px_0_var(--text)]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-display text-[var(--cta-dark)] flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                Placement Drive
              </span>
              <span className="text-xs font-bold font-display bg-white border-2 border-[var(--text)] text-[var(--cta-dark)] px-2 py-0.5 rounded-full shadow-[1px_1px_0_var(--text)]">
                Closes Today
              </span>
            </div>
            <h4 className="text-sm font-bold font-display text-[var(--text)]">
              TCS Prime (11.5 LPA)
            </h4>
            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 leading-relaxed">
              Your profile has a <strong>96% match</strong> with zero active backlogs.
            </p>
          </div>
          <Link
            href="/student/placements"
            className="text-xs font-bold text-[var(--cta-dark)] hover:underline flex items-center gap-1"
          >
            1-Click Apply Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Student Quick Actions Bar */}
      <div>
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Quick Academic Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { label: "Safe-Bunk Calc", href: "/student/attendance", icon: CalendarCheck2, bg: "bg-[var(--primary)]" },
            { label: "Today's Schedule", href: "/student/timetable", icon: CalendarDays, bg: "bg-[var(--secondary)]" },
            { label: "Assignments", href: "/student/assignments", icon: FileText, bg: "bg-[var(--accent-mint)]" },
            { label: "Exams & Seating", href: "/student/exams", icon: GraduationCap, bg: "bg-[var(--accent-purple)]" },
            { label: "Results & SGPA", href: "/student/results", icon: Award, bg: "bg-[var(--primary)]" },
            { label: "Pending Fees", href: "/student/fees", icon: CreditCard, bg: "bg-[var(--secondary)]" },
            { label: "Scholarships", href: "/student/scholarships", icon: Gift, bg: "bg-[var(--accent-mint)]" },
            { label: "Placements", href: "/student/placements", icon: Briefcase, bg: "bg-[var(--accent-purple)]" },
            { label: "Raise Grievance", href: "/student/complaints", icon: AlertCircle, bg: "bg-[var(--primary)]" },
            { label: "College Bylaws", href: "/documents", icon: Sparkles, bg: "bg-[var(--secondary)]" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-2xl border-2 border-[var(--text)] bg-white hover:bg-[var(--secondary)]/30 transition-all shadow-[2px_2px_0_var(--text)] hover:translate-x-[1px] hover:translate-y-[1px] group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-xl border-2 border-[var(--text)] ${item.bg} flex items-center justify-center shrink-0 shadow-[1px_1px_0_var(--text)]`}>
                  <Icon className="h-4 w-4 text-[var(--text)]" />
                </div>
                <span className="text-xs font-bold font-display text-[var(--text)] truncate">
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
