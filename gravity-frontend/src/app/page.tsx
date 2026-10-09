import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  CalendarCheck2,
  BookOpen,
  Briefcase,
  Bot,
  GraduationCap,
  Users,
  CheckCircle2,
  HelpCircle,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-base shadow-md shadow-brand-500/20">
            A
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">College OS</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              Next-Gen Academic Engine
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Sign In
            </Button>
          </Link>
          <Link href="/student/dashboard">
            <Button size="sm" className="text-xs gap-1.5 shadow-md shadow-brand-500/20">
              Launch Portal <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-brand-500 animate-pulse" />
          <span>Autonomous AI Copilot grounded in college regulations</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
          Your College.{" "}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            One Intelligent Platform.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Attendance, academics, communication, placements, and college knowledge — powered by AI that eliminates bureaucracy and actively helps you succeed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/student/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-sm gap-2 shadow-xl shadow-brand-500/25">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm">
              Explore Role Portals
            </Button>
          </Link>
        </div>

        {/* Hero Interactive Mock Preview Card */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-2xl text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500" />
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono text-muted-foreground">
                college-os.apex.edu.in/student/dashboard
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Live Mock Environment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  ⚠ Attendance Alert
                </span>
                <span className="text-xs font-bold text-amber-600">71.1%</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                DBMS attendance is below 75%. You need approximately <strong>3 consecutive classes</strong> to restore examination eligibility.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">
                  📚 Assignment Due
                </span>
                <span className="text-[10px] font-bold bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-200 px-1.5 py-0.5 rounded">
                  Tomorrow
                </span>
              </div>
              <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
                B+ Tree Indexing & Query Cost Optimization (CS601) due Oct 10 at 11:59 PM.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  🎯 Placement Drive
                </span>
                <span className="text-xs font-bold text-emerald-600">96% Match</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                TCS Prime applications close today. Zero backlogs verified, eligible for 11.5 LPA band.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Why Traditional ERPs Fail Colleges
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Most academic portals are 15-year-old databases wrapped in tedious tables. College OS flips the paradigm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 space-y-4">
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <span>✕</span> The Legacy ERP Experience
            </h3>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Boring, cluttered tables with 30 menu items nobody uses.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Students have no idea how many classes they can afford to miss or how to recover.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Complaints get lost in physical offices or neglected inboxes.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                Manual notice boards and missed scholarship deadlines.
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-4">
            <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <span>✓</span> The Intelligent College OS Experience
            </h3>
            <ul className="space-y-3 text-xs text-foreground font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Intelligent attention cards that highlight exactly what matters today.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Live Safe-Bunk Calculator: &quot;If I attend next X classes, my attendance becomes Y%.&quot;
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                AI Copilot answers questions directly grounded in official college bylaws.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                AI matches students with scholarships and placement drives automatically.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Role Personas Overview */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tailored for Every Stakeholder
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            No one-size-fits-all menus. Each role gets an autonomous workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">For Students</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Personal assistant feed, attendance defense, assignment countdowns, AI knowledge answers, and instant grievance tracking.
            </p>
            <Link href="/student/dashboard" className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              Open Student Portal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">For Teachers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              1-click rapid roll call, at-risk student detection, assignment rubric grading, and automatic workload scheduling.
            </p>
            <Link href="/teacher/dashboard" className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              Open Teacher Portal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">For HODs</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Department attendance health, faculty teaching hours, exam pass trends, and pending medical condonation triage.
            </p>
            <Link href="/hod/dashboard" className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              Open HOD Portal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm">For Admins</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &quot;What Needs Attention Today&quot; triage, fee collection pipelines, conflict-free timetable builder, and AI observability.
            </p>
            <Link href="/admin/dashboard" className="text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              Open Admin Portal <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Enterprise Security & Architecture
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Constructed with strict Role-Based Access Control (RBAC), sanitization, and data isolation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl border border-border bg-card">
            <ShieldCheck className="h-6 w-6 text-brand-600 mb-2" />
            <h4 className="font-semibold text-sm">Authoritative Backend RBAC</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Frontend route guards complement strict NestJS JWT and server-enforced authorization policies.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <Zap className="h-6 w-6 text-brand-600 mb-2" />
            <h4 className="font-semibold text-sm">Real-time Socket Synchronization</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Instant notification delivery for attendance strikes, notices, and exam schedules with TanStack Query invalidation.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card">
            <Bot className="h-6 w-6 text-brand-600 mb-2" />
            <h4 className="font-semibold text-sm">Auditable AI Observability</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Every tool execution, latency metric, and vector citation is logged for administrative transparency without exposing prompt internals.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-border">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              How does the Attendance Safe-Bunk Calculator work?
            </h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              It continuously calculates the formula `(Attended + X) / (Total + X) &gt;= 0.75` for recovery and `Attended / (Total + Y) &gt;= 0.75` for safe bunks, preventing last-minute examination hall ticket debarment.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              Can teachers and students use the platform offline or on mobile?
            </h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Yes, College OS is built with full responsive layouts, touch-friendly mobile bottom navigation, and PWA shell capabilities.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              How are AI answers verified for safety?
            </h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Every response displays visual chips distinguishing &quot;Official College Records&quot; from &quot;AI Advisory Recommendations&quot; and cites the exact policy clauses and page numbers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 text-center text-xs text-muted-foreground bg-card/40">
        <p>© 2026 Apex Institute of Technology • College Operating System. Designed for peak academic performance.</p>
      </footer>
    </div>
  );
}
