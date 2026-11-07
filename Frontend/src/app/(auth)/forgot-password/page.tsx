"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle2, Building, AlertCircle } from "lucide-react";
import { authApi } from "@/services/api/auth.api";

export default function ForgotPasswordPage() {
  const [collegeCode, setCollegeCode] = useState("SDIET");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(collegeCode.trim() || "SDIET", email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to process password reset request. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-brand-900/10 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">Reset Password</h1>
          <p className="text-xs text-muted-foreground">
            Enter your college registered email to receive an institutional reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Check Your Inbox</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We sent reset instructions for <strong>{email}</strong>. Follow the link to securely set a new password.
              </p>
              <Link href="/login" className="block pt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">College Short Code</label>
                <Input
                  type="text"
                  placeholder="e.g. SDIET"
                  value={collegeCode}
                  onChange={(e) => setCollegeCode(e.target.value)}
                  required
                  icon={<Building className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">College Email</label>
                <Input
                  type="email"
                  placeholder="name@sdiet.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <Button type="submit" isLoading={loading} className="w-full text-xs font-semibold py-2.5">
                Send Reset Instructions
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
