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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t-3 border-[var(--text)] bg-white z-40 px-2 flex items-center justify-around select-none">
      <Link
        href={`${basePath}/dashboard`}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes("dashboard")
            ? "text-[var(--text)] bg-[var(--secondary)] border-2 border-[var(--text)] shadow-[1px_1px_0_var(--text)]"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        )}
      >
        <LayoutDashboard className="h-5 w-5 mb-0.5" />
        <span>Hub</span>
      </Link>

      <Link
        href={role === "STUDENT" ? "/student/attendance" : "/teacher/attendance"}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes("attendance")
            ? "text-[var(--text)] bg-[var(--primary)] border-2 border-[var(--text)] shadow-[1px_1px_0_var(--text)]"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        )}
      >
        <CalendarCheck2 className="h-5 w-5 mb-0.5" />
        <span>Attend</span>
      </Link>

      {/* Floating Center AI Copilot Action */}
      <button
        onClick={toggleCopilot}
        className="-mt-6 flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--cta)] border-3 border-[var(--text)] text-white shadow-[3px_3px_0_var(--text)] active:scale-95 transition-transform"
        aria-label="Open AI Copilot"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>

      <Link
        href={role === "STUDENT" ? "/student/timetable" : "/teacher/assignments"}
        className={cn(
          "flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display transition-colors rounded-xl",
          pathname.includes("timetable") || pathname.includes("assignments")
            ? "text-[var(--text)] bg-[var(--accent-mint)] border-2 border-[var(--text)] shadow-[1px_1px_0_var(--text)]"
            : "text-[var(--text-muted)] hover:text-[var(--text)]"
        )}
      >
        <CalendarDays className="h-5 w-5 mb-0.5" />
        <span>{role === "STUDENT" ? "Schedule" : "Tasks"}</span>
      </Link>

      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center w-14 py-1 text-[10px] font-bold font-display text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <Menu className="h-5 w-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  );
}
