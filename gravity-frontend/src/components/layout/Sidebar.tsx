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
        "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 relative select-none",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        {!isSidebarCollapsed && (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-sm shadow-md shadow-brand-500/20">
              A
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground block leading-tight">
                College OS
              </span>
              <span className="text-[10px] text-muted-foreground block font-medium">
                Apex Institute of Tech
              </span>
            </div>
          </Link>
        )}
        {isSidebarCollapsed && (
          <Link href="/" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black text-sm">
              A
            </div>
          </Link>
        )}
        <button
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            isSidebarCollapsed && "hidden"
          )}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navLinks.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative",
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold shadow-sm dark:bg-brand-950/40 dark:text-brand-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isSidebarCollapsed && "justify-center px-0 py-2.5"
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!isSidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.badge && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Toggle button when collapsed */}
      {isSidebarCollapsed && (
        <div className="p-2 border-t border-border flex justify-center">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* User Mini Card */}
      {!isSidebarCollapsed && (
        <div className="p-3 border-t border-border bg-card/40">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
