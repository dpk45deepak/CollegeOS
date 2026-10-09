"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password === confirmPassword) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-brand-900/10 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">Set New Password</h1>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with letters, numbers, and symbols.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Password Updated!</h3>
              <p className="text-xs text-muted-foreground">
                Your password has been changed. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  icon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  icon={<Lock className="h-4 w-4" />}
                />
              </div>

              <Button type="submit" className="w-full text-xs font-semibold py-2.5">
                Update Password & Sign In
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
