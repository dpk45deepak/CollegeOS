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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-all shadow-sm"
        title="Switch simulated user role"
      >
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline text-muted-foreground">Viewing as:</span>
        <span className="font-semibold text-brand-600 dark:text-brand-400">
          {user?.role ? user.role.replace("_", " ") : "STUDENT"}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-popover p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 border-b border-border mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-brand-500" />
                Role Simulation Mode
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium">
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
