"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { UserRole } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Lock,
  Mail,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setError(null);
    try {
      const idVal = loginId.trim() || (typeof document !== "undefined" ? (document.getElementById("loginId") as HTMLInputElement)?.value?.trim() : "") || "";
      const passVal = password || (typeof document !== "undefined" ? (document.getElementById("password") as HTMLInputElement)?.value : "") || "";

      if (!idVal || !passVal) {
        setError("Please enter your College ID and password.");
        return;
      }

      const user = await login(idVal, passVal);
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get("redirect");
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else {
        redirectByRole(user.role);
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "Invalid institutional credentials. Please check your login ID and password.";
      setError(msg);
    }
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
                Institutional ERP
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold font-display text-[var(--text)]">
            Institutional Sign In
          </h1>
          <p className="text-xs font-bold text-[var(--text-muted)]">
            Authenticate using your assigned College ID, Student Roll Number, or Staff ID.
          </p>
        </div>

        {/* Login Card */}
        <div className="clay-card p-6 sm:p-8 bg-card shadow-[8px_8px_0_var(--edu-border)]">
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="loginId" className="text-xs font-bold font-display text-[var(--text)]">
                College ID / Roll Number
              </label>
              <Input
                type="text"
                id="loginId"
                placeholder="e.g. CSE23001, CSE-T01, or ADMIN001"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                icon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold font-display text-[var(--text)]">
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
                id="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
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
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary w-full text-sm py-3 mt-2"
            >
              {isLoading ? "Authenticating..." : "Sign In to College OS"}
            </button>
          </form>

          {/* Security & Access Info */}
          <div className="mt-6 pt-5 border-t-2 border-[var(--border)] text-xs text-[var(--text-muted)] space-y-2">
            <div className="flex items-center gap-2 text-[var(--text)] font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Role-Based Institutional Access Control</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Your assigned roles (Student, Faculty, HOD, Administrator, Accountant, Placement Officer) are verified automatically upon secure sign-in.
            </p>
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
