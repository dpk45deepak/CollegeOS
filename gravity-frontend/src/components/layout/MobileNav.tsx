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
  Sparkles,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { toggleSidebar, toggleCopilot } = useUIStore();

  const role = user?.role || "STUDENT";

  const getBasePath = () => {
    if (role === "TEACHER") return "/teacher";
    if (role === "HOD") return "/hod";
    if (role === "ADMIN") return "/admin";
    return "/student";
  };

  const basePath = getBasePath();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-card/90 backdrop-blur-lg z-40 px-2 flex items-center justify-around">
      <Link
        href={`${basePath}/dashboard`}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition-colors",
          pathname.includes("dashboard")
            ? "text-brand-600 dark:text-brand-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-0.5" />
        <span>Hub</span>
      </Link>

      <Link
        href={role === "STUDENT" ? "/student/attendance" : "/teacher/attendance"}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition-colors",
          pathname.includes("attendance")
            ? "text-brand-600 dark:text-brand-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarCheck2 className="h-5 w-5 mb-0.5" />
        <span>Attend</span>
      </Link>

      {/* Floating Center AI Copilot Action */}
      <button
        onClick={toggleCopilot}
        className="-mt-5 flex flex-col items-center justify-center h-12 w-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/30 active:scale-95 transition-transform"
        aria-label="Open AI Copilot"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>

      <Link
        href={role === "STUDENT" ? "/student/timetable" : "/teacher/assignments"}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium transition-colors",
          pathname.includes("timetable") || pathname.includes("assignments")
            ? "text-brand-600 dark:text-brand-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <CalendarDays className="h-5 w-5 mb-0.5" />
        <span>{role === "STUDENT" ? "Schedule" : "Tasks"}</span>
      </Link>

      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center w-14 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
}
