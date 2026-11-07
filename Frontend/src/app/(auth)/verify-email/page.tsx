"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { authApi } from "@/services/api/auth.api";
import { apiClient } from "@/lib/api/client";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams?.get("token") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (urlToken && urlToken.length >= 6) {
      // Auto-trigger verification if full token is in URL
      executeVerification(urlToken);
    }
  }, [urlToken]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const executeVerification = async (tokenToVerify: string) => {
    setError(null);
    setLoading(true);

    try {
      await authApi.verifyEmail(tokenToVerify);
      setVerified(true);
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code. Please check or request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const token = urlToken || otp.join("");
    if (!token || token.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    executeVerification(token);
  };

  const handleResend = async () => {
    const targetEmail = email || prompt("Please confirm your institutional email to resend verification code:");
    if (!targetEmail) return;

    setResending(true);
    setResendMsg(null);
    setError(null);

    try {
      await apiClient("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail.trim() }),
      });
      setResendMsg(`A fresh verification code was sent to ${targetEmail}.`);
      setTimeout(() => setResendMsg(null), 5000);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code. Please verify email address.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
      {verified ? (
        <div className="text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-semibold">Institutional Access Verified!</h3>
          <p className="text-xs text-muted-foreground">Redirecting to your verified workspace...</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
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

          <div className="flex justify-between gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-12 h-12 text-center text-lg font-bold rounded-xl border border-input bg-background focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            ))}
          </div>

          <Button type="submit" isLoading={loading} className="w-full text-xs font-semibold py-2.5">
            Verify & Continue
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Didn&apos;t receive code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              {resending ? <RefreshCw className="h-3 w-3 animate-spin" /> : null} Resend Code
            </button>
          </div>
        </form>
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
            Enter the 6-digit verification code sent to your registered academic email.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Verifying session credentials...</div>}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
