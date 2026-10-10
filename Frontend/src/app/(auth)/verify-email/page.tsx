"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);

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

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join("").length === 6) {
      setVerified(true);
      setTimeout(() => {
        router.push("/student/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-brand-900/10 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Verify Institutional Device</h1>
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit verification code sent to your registered mobile/email.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {verified ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-semibold">Device Authorized!</h3>
              <p className="text-xs text-muted-foreground">Loading your College OS workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
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

              <Button type="submit" className="w-full text-xs font-semibold py-2.5">
                Verify & Continue
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Didn&apos;t receive code?{" "}
                <button type="button" className="text-brand-600 hover:underline font-medium">
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
