"use client";

import React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore();

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
          { href: "/admin/ai-observability", label: "AI Observability", icon: Cpu },
          { href: "/documents", label: "College Knowledge", icon: BookOpen },
          { href: "/notices", label: "Campus Broadcasts", icon: Bell },
          { href: "/settings", label: "System Config", icon: Settings },
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
    <aside
      className={cn(
        "hidden md:flex flex-col border-r-3 border-[var(--text)] bg-white transition-all duration-300 relative select-none z-30",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b-3 border-[var(--text)] bg-[var(--bg-cream)]">
        {!isSidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] text-[var(--text)] font-bold font-display text-base shadow-[2px_2px_0_var(--text)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold font-display text-base tracking-tight text-[var(--text)] block leading-tight">
                LearnHub
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                College OS
              </span>
            </div>
          </Link>
        )}
        {isSidebarCollapsed && (
          <Link href="/" className="mx-auto">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)] border-3 border-[var(--text)] text-[var(--text)] font-bold font-display text-base shadow-[2px_2px_0_var(--text)]">
              <BookOpen className="w-5 h-5" />
            </div>
          </Link>
        )}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "w-7 h-7 rounded-lg border-2 border-[var(--text)] bg-white text-[var(--text)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors shadow-[1px_1px_0_var(--text)]",
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
                  ? "bg-[var(--secondary)] text-[var(--text)] border-2 border-[var(--text)] shadow-[2px_2px_0_var(--text)] translate-x-[1px] translate-y-[1px]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-cream)] hover:text-[var(--text)] border-2 border-transparent hover:border-[var(--text)]",
                isSidebarCollapsed && "justify-center px-0 py-2.5"
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-[var(--text)]"
                    : "text-[var(--text-muted)] group-hover:text-[var(--text)]"
                )}
              />
              {!isSidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-purple)] text-[var(--text)] border border-[var(--text)] shadow-[1px_1px_0_var(--text)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Toggle button when collapsed */}
      {isSidebarCollapsed && (
        <div className="p-2 border-t-3 border-[var(--text)] flex justify-center bg-[var(--bg-cream)]">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="w-8 h-8 rounded-xl border-2 border-[var(--text)] bg-white text-[var(--text)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--text)]"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User Mini Card */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-t-3 border-[var(--text)] bg-[var(--bg-cream)]">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-2 rounded-2xl border-2 border-[var(--text)] bg-white hover:bg-[var(--secondary)]/30 transition-colors shadow-[2px_2px_0_var(--text)]"
          >
            <div className="h-8 w-8 rounded-xl bg-[var(--accent-mint)] border-2 border-[var(--text)] text-[var(--text)] flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-[1px_1px_0_var(--text)]">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[var(--text)] truncate font-display">{user?.name}</p>
              <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
