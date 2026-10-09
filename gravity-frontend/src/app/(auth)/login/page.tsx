"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Mail,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoRole, isLoading } = useAuthStore();

  const [email, setEmail] = useState("deepak.k@apex.edu.in");
  const [password, setPassword] = useState("Password@123");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      redirectByRole(user.role);
    } catch {
      setError("Invalid credentials or college network unreachable. Try Demo Login below.");
    }
  };

  const handleQuickRole = (role: UserRole) => {
    switchDemoRole(role);
    redirectByRole(role);
  };

  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case "TEACHER":
        router.push("/teacher/dashboard");
        break;
      case "HOD":
        router.push("/hod/dashboard");
        break;
      case "ADMIN":
        router.push("/admin/dashboard");
        break;
      case "PLACEMENT_OFFICER":
        router.push("/student/placements");
        break;
      case "ACCOUNTANT":
        router.push("/student/fees");
        break;
      case "STUDENT":
      default:
        router.push("/student/dashboard");
        break;
    }
  };

  return (
    <div className="edu-platform always-light min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-cream)] relative overflow-hidden select-none">
      {/* Decorative Floating Badges in Background */}
      <div className="absolute top-12 left-12 hidden lg:flex w-16 h-16 rounded-2xl bg-[var(--primary)] border-3 border-[var(--text)] items-center justify-center shadow-[4px_4px_0_var(--text)]">
        <span className="text-2xl select-none">🎯</span>
      </div>
      <div className="absolute bottom-16 right-16 hidden lg:flex w-20 h-20 rounded-3xl bg-[var(--accent-purple)] border-3 border-[var(--text)] items-center justify-center shadow-[4px_4px_0_var(--text)]">
        <span className="text-3xl select-none">📚</span>
      </div>
      <div className="absolute top-24 right-24 hidden lg:flex w-14 h-14 rounded-full bg-[var(--accent-mint)] border-3 border-[var(--text)] items-center justify-center shadow-[3px_3px_0_var(--text)]">
        <span className="text-xl select-none">⭐</span>
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] border-3 border-[var(--text)] text-[var(--text)] font-bold text-xl shadow-[3px_3px_0_var(--text)] group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-[var(--text)]" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-bold font-display text-2xl tracking-tight text-[var(--text)]">
                CollegeOS
              </span>
              <span className="text-[10px] font-bold text-[var(--cta-dark)] uppercase tracking-wider">
                Campus ERP
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-display text-[var(--text)]">
            Apex Institute Portal
          </h1>
          <p className="text-xs font-bold text-[var(--text-muted)]">
            Sign in with your institutional credentials or use instant demo access.
          </p>
        </div>

        {/* Login Card */}
        <div className="clay-card p-6 sm:p-8 bg-card shadow-[8px_8px_0_var(--edu-border)]">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold font-display text-[var(--text)]">
                College ID / Email
              </label>
              <Input
                type="email"
                placeholder="rollnumber@apex.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                icon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold font-display text-[var(--text)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-[var(--cta-dark)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-muted)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-lg border-2 border-[var(--text)] text-[var(--cta)] focus:ring-[var(--cta)] h-4 w-4 cursor-pointer"
                />
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-sm py-3 mt-2"
            >
              Sign In to College OS
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-7 pt-5 border-t-3 border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold font-display text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[var(--cta)]" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-[var(--text)] bg-[var(--accent-mint)] border border-[var(--text)] px-2 py-0.5 rounded-full font-bold shadow-[1px_1px_0_var(--text)]">
                No Password Needed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs font-display">
              <button
                type="button"
                onClick={() => handleQuickRole("STUDENT")}
                className="p-3 rounded-2xl border-2 border-[var(--text)] bg-[var(--accent-mint)]/40 hover:bg-[var(--accent-mint)] text-left shadow-[2px_2px_0_var(--text)] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <div className="font-bold text-[var(--text)]">Student Hub</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)]">Deepak Kumar</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("TEACHER")}
                className="p-3 rounded-2xl border-2 border-[var(--text)] bg-[var(--primary)]/40 hover:bg-[var(--primary)] text-left shadow-[2px_2px_0_var(--text)] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <div className="font-bold text-[var(--text)]">Teacher Portal</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)]">Dr. Vikram Sharma</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("HOD")}
                className="p-3 rounded-2xl border-2 border-[var(--text)] bg-[var(--accent-purple)]/40 hover:bg-[var(--accent-purple)] text-left shadow-[2px_2px_0_var(--text)] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <div className="font-bold text-[var(--text)]">HOD Operations</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)]">Prof. R. Sen</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("ADMIN")}
                className="p-3 rounded-2xl border-2 border-[var(--text)] bg-[var(--secondary)]/40 hover:bg-[var(--secondary)] text-left shadow-[2px_2px_0_var(--text)] transition-transform active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <div className="font-bold text-[var(--text)]">Admin Operations</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)]">Arun Mehra</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-bold text-[var(--text-muted)]">
          Protected by Enterprise SSO • Need help?{" "}
          <Link href="/student/complaints" className="text-[var(--cta-dark)] hover:underline">
            Contact IT Helpdesk
          </Link>
        </p>
      </div>
    </div>
  );
}
