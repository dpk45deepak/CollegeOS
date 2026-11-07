"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  LayoutDashboard,
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
  Bell,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  BookMarked,
  Cpu,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const {
    isSidebarOpen,
    setSidebarOpen,
    isSidebarCollapsed,
    setSidebarCollapsed,
  } = useUIStore();

  // Auto-close mobile sidebar drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const role = user?.role || "STUDENT";

  const getNavLinks = () => {
    switch (role) {
      case "TEACHER":
        return [
          { href: "/teacher/dashboard", label: "Overview", icon: LayoutDashboard },
          { href: "/teacher/attendance", label: "Mark Attendance", icon: CalendarCheck2 },
          { href: "/teacher/assignments", label: "Assignments & Rubrics", icon: FileText },
          { href: "/teacher/students", label: "Student Performance", icon: BarChart3 },
          { href: "/notices", label: "College Notices", icon: Bell },
          { href: "/messages", label: "Student Messaging", icon: MessageSquare },
        ];
      case "HOD":
        return [
          { href: "/hod/dashboard", label: "Department Intelligence", icon: LayoutDashboard },
          { href: "/teacher/attendance", label: "Department Attendance", icon: CalendarCheck2 },
          { href: "/teacher/students", label: "Course Health", icon: BarChart3 },
          { href: "/student/complaints", label: "Grievances & Tickets", icon: AlertCircle },
          { href: "/notices", label: "Announcements", icon: Bell },
        ];
      case "ADMIN":
        return [
          { href: "/admin/dashboard", label: "Triage Operations", icon: LayoutDashboard },
          { href: "/admin/analytics", label: "Executive Analytics", icon: BarChart3 },
          { href: "/admin/users", label: "User Directory", icon: Users },
          { href: "/admin/academics", label: "Timetable Builder", icon: CalendarDays },
          { href: "/student/complaints", label: "Grievances & SLA Triage", icon: AlertCircle },
          { href: "/admin/ai-observability", label: "AI Observability", icon: Cpu },
          { href: "/documents", label: "College Knowledge", icon: BookOpen },
          { href: "/notices", label: "Campus Broadcasts", icon: Bell },
          { href: "/settings", label: "System Config", icon: Settings },
        ];
      case "PLACEMENT_OFFICER":
        return [
          { href: "/student/placements", label: "Placements & Drives", icon: Briefcase },
          { href: "/notices", label: "Placement Notices", icon: Bell },
          { href: "/messages", label: "Student Messages", icon: MessageSquare },
          { href: "/documents", label: "Company Profiles", icon: BookOpen },
        ];
      case "ACCOUNTANT":
        return [
          { href: "/student/fees", label: "Fee Ledger & Dues", icon: CreditCard },
          { href: "/admin/analytics", label: "Financial Analytics", icon: BarChart3 },
          { href: "/notices", label: "Financial Circulars", icon: Bell },
          { href: "/documents", label: "Audits & Receipts", icon: BookOpen },
        ];
      case "STUDENT":
      default:
        return [
          { href: "/student/dashboard", label: "My Hub", icon: LayoutDashboard },
          { href: "/student/ai", label: "College AI Copilot", icon: Sparkles, badge: "AI" },
          { href: "/student/attendance", label: "Attendance & Safe Bunk", icon: CalendarCheck2 },
          { href: "/student/timetable", label: "Timetable", icon: CalendarDays },
          { href: "/student/assignments", label: "Assignments", icon: FileText },
          { href: "/student/exams", label: "Exams & Seating", icon: GraduationCap },
          { href: "/student/results", label: "Results & SGPA", icon: Award },
          { href: "/student/fees", label: "Fee Ledger", icon: CreditCard },
          { href: "/student/scholarships", label: "Scholarships", icon: Gift },
          { href: "/student/placements", label: "Placements & Internships", icon: Briefcase },
          { href: "/student/complaints", label: "Complaints & Grievance", icon: AlertCircle },
          { href: "/documents", label: "College Documents", icon: BookOpen },
          { href: "/notices", label: "Notices", icon: Bell },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r-3 border-border bg-card transition-all duration-300 relative select-none z-30",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b-3 border-border bg-[var(--bg-cream)]">
          {!isSidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] border-3 border-[var(--edu-border)] text-slate-900 font-bold font-display text-base shadow-[2px_2px_0_var(--edu-border)]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold font-display text-base tracking-tight text-foreground block leading-tight">
                  CollegeOS
                </span>
                <span className="text-[10px] font-bold text-muted-foreground block">
                  Campus ERP
                </span>
              </div>
            </Link>
          )}
          {isSidebarCollapsed && (
            <Link href="/" className="mx-auto">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] border-3 border-[var(--edu-border)] text-slate-900 font-bold font-display text-base shadow-[2px_2px_0_var(--edu-border)]">
                <GraduationCap className="w-5 h-5" />
              </div>
            </Link>
          )}
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "w-7 h-7 rounded-lg border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center transition-colors shadow-[1px_1px_0_var(--edu-border)] cursor-pointer",
              isSidebarCollapsed && "hidden"
            )}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative font-display",
                  isActive
                    ? "bg-[var(--secondary)] text-slate-900 border-2 border-[var(--edu-border)] shadow-[2px_2px_0_var(--edu-border)] translate-x-[1px] translate-y-[1px]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-2 border-transparent hover:border-border",
                  isSidebarCollapsed && "justify-center px-0 py-2.5"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-slate-900"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {!isSidebarCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-purple)] text-slate-900 border border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Toggle button when collapsed */}
        {isSidebarCollapsed && (
          <div className="p-2 border-t-3 border-border flex justify-center bg-[var(--bg-cream)]">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-8 h-8 rounded-xl border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--edu-border)] cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* User Mini Card */}
        {!isSidebarCollapsed && (
          <div className="p-3 border-t-3 border-border bg-[var(--bg-cream)]">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-2 rounded-2xl border-2 border-border bg-card hover:bg-[var(--secondary)]/20 transition-colors shadow-[2px_2px_0_var(--edu-border)]"
            >
              <div className="h-8 w-8 rounded-xl bg-[var(--accent-mint)] border-2 border-[var(--edu-border)] text-slate-900 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-[1px_1px_0_var(--edu-border)]">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate font-display">{user?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-canvas Slide-over Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r-3 border-border flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-[8px_0_0_var(--edu-border)] select-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b-3 border-border bg-[var(--bg-cream)]">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] border-3 border-[var(--edu-border)] text-slate-900 font-bold font-display text-base shadow-[2px_2px_0_var(--edu-border)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold font-display text-base tracking-tight text-foreground block leading-tight">
                CollegeOS
              </span>
              <span className="text-[10px] font-bold text-muted-foreground block">
                Campus ERP
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-xl border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center transition-colors shadow-[1px_1px_0_var(--edu-border)] cursor-pointer"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group font-display",
                  isActive
                    ? "bg-[var(--secondary)] text-slate-900 border-2 border-[var(--edu-border)] shadow-[2px_2px_0_var(--edu-border)] translate-x-[1px] translate-y-[1px]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-2 border-transparent hover:border-border"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-slate-900"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-purple)] text-slate-900 border border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Drawer User Footer */}
        <div className="p-3 border-t-3 border-border bg-[var(--bg-cream)]">
          <Link
            href="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-2xl border-2 border-border bg-card hover:bg-[var(--secondary)]/20 transition-colors shadow-[2px_2px_0_var(--edu-border)]"
          >
            <div className="h-8 w-8 rounded-xl bg-[var(--accent-mint)] border-2 border-[var(--edu-border)] text-slate-900 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-[1px_1px_0_var(--edu-border)]">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-foreground truncate font-display">{user?.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
