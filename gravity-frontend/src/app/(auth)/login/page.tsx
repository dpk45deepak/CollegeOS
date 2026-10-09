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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-radial from-brand-900/10 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-brand-500/25">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              College OS
            </span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Welcome to Apex College</h1>
          <p className="text-xs text-muted-foreground">
            Sign in with your institutional credentials to enter your workspace.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
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

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
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
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
                />
                Remember this device
              </label>
            </div>

            <Button
              type="submit"
              className="w-full text-xs font-semibold py-2.5 shadow-md shadow-brand-500/20"
              isLoading={isLoading}
            >
              Sign In to College OS
            </Button>
          </form>

          {/* Google SSO Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              or continue with
            </span>
            <div className="h-[1px] flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleQuickRole("STUDENT")}
            className="w-full text-xs gap-2 py-2"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google Institutional Workspace
          </Button>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-brand-500" />
                Instant Role Access
              </span>
              <span className="text-[10px] text-brand-600 bg-brand-50 dark:bg-brand-950 px-1.5 py-0.5 rounded font-medium">
                No Password Needed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickRole("STUDENT")}
                className="p-2 rounded-lg border border-border hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-semibold text-foreground">Student</div>
                <div className="text-[10px] text-muted-foreground">Deepak Kumar</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("TEACHER")}
                className="p-2 rounded-lg border border-border hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-semibold text-foreground">Teacher</div>
                <div className="text-[10px] text-muted-foreground">Dr. Vikram Sharma</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("HOD")}
                className="p-2 rounded-lg border border-border hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-semibold text-foreground">HOD</div>
                <div className="text-[10px] text-muted-foreground">Prof. R. Sen</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole("ADMIN")}
                className="p-2 rounded-lg border border-border hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-semibold text-foreground">Admin</div>
                <div className="text-[10px] text-muted-foreground">Arun Mehra</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground">
          Protected by Enterprise SSO & MFA • Need help?{" "}
          <Link href="/student/complaints" className="text-brand-600 hover:underline">
            Contact IT Helpdesk
          </Link>
        </p>
      </div>
    </div>
  );
}
