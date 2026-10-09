"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { UserRole } from "@/types";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, UserCircle2, Sparkles } from "lucide-react";

const roles: { role: UserRole; label: string; desc: string; redirect: string }[] = [
  { role: "STUDENT", label: "Student", desc: "Deepak Kumar (Sem 6)", redirect: "/student/dashboard" },
  { role: "TEACHER", label: "Teacher", desc: "Dr. Vikram Sharma (Assoc. Prof)", redirect: "/teacher/dashboard" },
  { role: "HOD", label: "HOD", desc: "Prof. Rajeshwari Sen (CSE Chair)", redirect: "/hod/dashboard" },
  { role: "ADMIN", label: "Admin", desc: "Arun Mehra (Registrar Office)", redirect: "/admin/dashboard" },
  { role: "PLACEMENT_OFFICER", label: "Placement Officer", desc: "Pooja Malhotra (Corporate Rel.)", redirect: "/student/placements" },
  { role: "ACCOUNTANT", label: "Accountant", desc: "Suresh Gupta (Bursar Office)", redirect: "/student/fees" },
];

export function QuickRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, switchDemoRole } = useAuthStore();
  const router = useRouter();

  const handleSelectRole = (role: UserRole, redirect: string) => {
    switchDemoRole(role);
    setIsOpen(false);
    router.push(redirect);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 border-[var(--text)] bg-white hover:bg-[var(--secondary)]/30 text-xs font-bold font-display text-[var(--text)] transition-all shadow-[2px_2px_0_var(--text)] cursor-pointer"
        title="Switch simulated user role"
      >
        <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--cta)] animate-pulse border border-[var(--text)]" />
        <span className="hidden sm:inline text-[var(--text-muted)] font-sans font-bold">Role:</span>
        <span className="font-bold text-[var(--text)]">
          {user?.role ? user.role.replace("_", " ") : "STUDENT"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-3 w-72 rounded-3xl border-3 border-[var(--text)] bg-white p-3 shadow-[6px_6px_0_var(--text)] z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 border-b-2 border-[var(--border)] mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold font-display tracking-wider uppercase text-[var(--text)] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[var(--cta)]" />
                Role Simulation
              </span>
              <span className="text-[10px] text-[var(--text)] bg-[var(--accent-mint)] border border-[var(--text)] px-2 py-0.5 rounded-full font-bold shadow-[1px_1px_0_var(--text)]">
                Live Switch
              </span>
            </div>
            <div className="space-y-0.5">
              {roles.map((item) => {
                const isActive = user?.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item.role, item.redirect)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
