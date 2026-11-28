"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, KeyRound, Mail } from "lucide-react";
import { authApi } from "@/services/api/auth.api";
import { apiClient } from "@/lib/api/client";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams?.get("token") || "";

  const [tokenInput, setTokenInput] = useState(urlToken);
  const [email, setEmail] = useState("");
  const [collegeCode, setCollegeCode] = useState(process.env.NEXT_PUBLIC_COLLEGE_SHORT_CODE || "SDIET");
  const [showResendForm, setShowResendForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const autoTriggeredRef = useRef<string | null>(null);

  const executeVerification = async (tokenToVerify: string) => {
    setError(null);
    setLoading(true);

    try {
      await authApi.verifyEmail(tokenToVerify);
      setVerified(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification token. Please request a fresh link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = urlToken.trim();
    if (trimmed && trimmed.length >= 20 && autoTriggeredRef.current !== trimmed) {
      autoTriggeredRef.current = trimmed;
      setTokenInput(trimmed);
      void executeVerification(trimmed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim() || urlToken.trim();
    if (!token || token.length < 20) {
      setError("Please paste your full email verification token (minimum 20 characters) or open the link from your inbox.");
      return;
    }
    void executeVerification(token);
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setShowResendForm(true);
      setError("Enter your institutional email address below to resend your verification link.");
      return;
    }

    setResending(true);
    setResendMsg(null);
    setError(null);

    try {
      const payload: Record<string, string> = { email: email.trim() };
      if (collegeCode.trim()) payload.collegeCode = collegeCode.trim();
      await apiClient("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResendMsg(`If an unverified account matches ${email.trim()}, a fresh verification link has been sent.`);
      setShowResendForm(false);
      setTimeout(() => setResendMsg(null), 6000);
    } catch (err: any) {
      setError(err?.message || "Failed to resend verification email. Please verify your details.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-5">
      {verified ? (
        <div className="text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold">Institutional Access Verified!</h3>
          <p className="text-xs text-muted-foreground">Redirecting to your verified workspace...</p>
        </div>
      ) : (
        <>
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {resendMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                {resendMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="verifyToken" className="text-xs font-semibold text-foreground block">
                Verification Token (from email link)
              </label>
              <Input
                id="verifyToken"
                type="text"
                placeholder="Paste verification token (20+ characters)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                minLength={20}
                maxLength={256}
                icon={<KeyRound className="h-4 w-4" />}
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full text-xs font-semibold py-2.5">
              Verify Email &amp; Continue
            </Button>
          </form>

          <div className="border-t border-border pt-4 space-y-3 text-xs">
            <div className="text-center text-muted-foreground">
              Need a new verification link?{" "}
              <button
                type="button"
                onClick={() => setShowResendForm((prev) => !prev)}
                className="text-brand-600 hover:underline font-medium"
              >
                {showResendForm ? "Hide resend form" : "Resend verification email"}
              </button>
            </div>

            {showResendForm && (
              <div className="space-y-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <Input
                  type="text"
                  placeholder="Institution Code (e.g. SDIET)"
                  value={collegeCode}
                  onChange={(e) => setCollegeCode(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Institutional Email (name@sdiet.edu)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full text-xs gap-1.5"
                >
                  {resending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  Send Verification Link
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-brand-900/10 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Verify Institutional Identity</h1>
          <p className="text-xs text-muted-foreground">
            Open the verification link from your email or paste the verification token below.
          </p>
        </div>

        <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">Loading...</div>}>
          <VerifyEmailForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground">
          Already verified?{" "}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
