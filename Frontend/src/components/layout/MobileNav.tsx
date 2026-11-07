"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarDays,
  Users,
  BarChart3,
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, toggleCopilot } = useUIStore();

  const role = user?.role || "STUDENT";

  const getNavConfig = () => {
    switch (role) {
      case "ADMIN":
        return {
          hubPath: "/admin/dashboard",
          hubLabel: "Hub",
          secondPath: "/admin/users",
          secondLabel: "Users",
          SecondIcon: Users,
          fourthPath: "/admin/analytics",
          fourthLabel: "Analytics",
          FourthIcon: BarChart3,
        };
      case "HOD":
        return {
          hubPath: "/hod/dashboard",
          hubLabel: "Hub",
          secondPath: "/teacher/attendance",
          secondLabel: "Attend",
          SecondIcon: CalendarCheck2,
          fourthPath: "/teacher/assignments",
          fourthLabel: "Tasks",
          FourthIcon: CalendarDays,
        };
      case "TEACHER":
        return {
          hubPath: "/teacher/dashboard",
          hubLabel: "Hub",
          secondPath: "/teacher/attendance",
          secondLabel: "Attend",
          SecondIcon: CalendarCheck2,
          fourthPath: "/teacher/assignments",
          fourthLabel: "Tasks",
          FourthIcon: CalendarDays,
        };
      case "STUDENT":
      default:
        return {
          hubPath: "/student/dashboard",
          hubLabel: "Hub",
          secondPath: "/student/attendance",
          secondLabel: "Attend",
          SecondIcon: CalendarCheck2,
          fourthPath: "/student/timetable",
          fourthLabel: "Schedule",
          FourthIcon: CalendarDays,
        };
    }
  };

  const nav = getNavConfig();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t-3 border-border bg-card z-40 px-2 flex items-center justify-around select-none">
      <Link
        href={nav.hubPath}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes("dashboard")
            ? "text-slate-900 bg-[var(--secondary)] border-2 border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-0.5" />
        <span>{nav.hubLabel}</span>
      </Link>

      <Link
        href={nav.secondPath}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes(nav.secondPath)
            ? "text-slate-900 bg-[var(--primary)] border-2 border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <nav.SecondIcon className="h-5 w-5 mb-0.5" />
        <span>{nav.secondLabel}</span>
      </Link>

      {/* Floating Center AI Copilot Action */}
      <button
        onClick={toggleCopilot}
        className="-mt-6 flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--cta)] border-3 border-[var(--edu-border)] text-white shadow-[3px_3px_0_var(--edu-border)] active:scale-95 transition-transform cursor-pointer"
        aria-label="Open AI Copilot"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>

      <Link
        href={nav.fourthPath}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes(nav.fourthPath)
            ? "text-slate-900 bg-[var(--accent-mint)] border-2 border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <nav.FourthIcon className="h-5 w-5 mb-0.5" />
        <span>{nav.fourthLabel}</span>
      </Link>

      <button
        onClick={toggleSidebar}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl cursor-pointer",
          isSidebarOpen
            ? "text-slate-900 bg-[var(--secondary)] border-2 border-[var(--edu-border)] shadow-[1px_1px_0_var(--edu-border)]"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
}
