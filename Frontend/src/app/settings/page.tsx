"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  Laptop,
  Sparkles,
  Bell,
  Shield,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authApi } from "@/services/api/auth.api";
import { notificationsApi } from "@/services/api/notifications.api";
import { useAuthStore } from "@/lib/auth/authStore";
import { getPreferences, savePreferences } from "@/lib/preferences";
import { Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [citationVerbosity, setCitationVerbosity] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword.length < 10 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwdError("New password must be 10-128 characters and include at least one letter and one digit.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }

    setPwdLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setPwdSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setPwdLoading(false);
    }
  };

  const [sessions, setSessions] = useState<Array<{ id: string; deviceName?: string; ip?: string; lastUsedAt?: string }>>([]);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const { logout } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const p = getPreferences();
    setAiSuggestions(p.aiSuggestions);
    setCitationVerbosity(p.citationVerbosity);
    setAttendanceAlerts(p.attendanceAlerts);
    authApi.getSessions().then((list) => setSessions(Array.isArray(list) ? list : [])).catch(() => {});
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleSave = () => {
    savePreferences({ aiSuggestions, citationVerbosity, attendanceAlerts });
    setSaveSuccess(true);
    toast.success("Preferences updated successfully.");
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRegisterPushDevice = async () => {
    setRegisteringPush(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission().catch(() => {});
      }
      let deviceToken = typeof localStorage !== "undefined" ? localStorage.getItem("college_os_web_push_token") : null;
      let usedBrowserSubscription = false;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
          const reg = await navigator.serviceWorker.ready;
          if (reg?.pushManager) {
            const sub =
              (await reg.pushManager.getSubscription()) ||
              (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey }));
            if (sub) {
              deviceToken = JSON.stringify(sub.toJSON());
              usedBrowserSubscription = true;
            }
          }
        } catch {
          // Fall back to deterministic device identifier when service worker is unavailable
        }
      }
      deviceToken = deviceToken || `web_${crypto.randomUUID()}`;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("college_os_web_push_token", deviceToken);
      }
      await notificationsApi.registerDevice(deviceToken, "web");
      toast.success(
        usedBrowserSubscription
          ? "Web Push subscription registered with browser."
          : "Device token registered (configure NEXT_PUBLIC_VAPID_PUBLIC_KEY + Service Worker for browser push)."
      );
    } catch (err: any) {
      toast.error(err?.message || "Could not register browser push device");
    } finally {
      setRegisteringPush(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast.success("All sessions revoked. Signing out...");
      await logout();
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke all sessions");
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">
          Platform Preferences & Privacy
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Customize UI appearance, AI Copilot reasoning verbosity, and notification push alerts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* Appearance Settings */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            Theme & Visual Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Laptop },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = mounted && theme === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id as "light" | "dark" | "system")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    isActive
                      ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Copilot Preferences */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI College Copilot Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground block">
                Autonomous Academic Advisory
              </span>
              <span className="text-muted-foreground text-[11px]">
                Generate automated attendance recovery recommendations on dashboard cards.
              </span>
            </div>
            <input
              type="checkbox"
              checked={aiSuggestions}
              onChange={(e) => setAiSuggestions(e.target.checked)}
              className="rounded border-border text-brand-600 h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <span className="font-semibold text-foreground block">
                Official RAG Source Citations
              </span>
              <span className="text-muted-foreground text-[11px]">
                Always display verified policy citations and ordinance page numbers in answers.
              </span>
            </div>
            <input
              type="checkbox"
              checked={citationVerbosity}
              onChange={(e) => setCitationVerbosity(e.target.checked)}
              className="rounded border-border text-brand-600 h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-600" />
            Real-time Institutional Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground block">
                Attendance Deficit Push Alerts
              </span>
              <span className="text-muted-foreground text-[11px]">
                Notify immediately if any subject drops below 75% examination threshold.
              </span>
            </div>
            <input
              type="checkbox"
              checked={attendanceAlerts}
              onChange={(e) => setAttendanceAlerts(e.target.checked)}
              className="rounded border-border text-brand-600 h-4 w-4"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" isLoading={registeringPush} onClick={handleRegisterPushDevice} className="text-xs">
          Register This Browser for Push Alerts
        </Button>
        <Button type="button" onClick={handleSave} className="text-xs shadow-md shadow-brand-500/20">
          Save Preferences
        </Button>
      </div>

      {/* Security: Password Change */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-500" />
            Security &amp; Password Update
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-3 text-xs">
          {pwdError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}
          {pwdSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Password updated. All other active sessions have been revoked.</span>
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
            />
            <input
              type="password"
              placeholder="New password (10+ chars, letter + digit)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
            />
            <div className="sm:col-span-3 flex justify-end">
              <Button type="submit" size="sm" isLoading={pwdLoading} className="text-xs">
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-600" />
            Active Authenticated Sessions ({sessions.length})
          </CardTitle>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            isLoading={loggingOutAll}
            onClick={handleLogoutAll}
            className="h-7 text-[11px]"
          >
            Sign Out All Devices
          </Button>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-2 text-xs">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground">No additional active sessions found.</p>
          ) : (
            sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-border/50 py-2">
                <div>
                  <div className="font-semibold">{s.deviceName || "Web Browser Session"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    IP: {s.ip || "N/A"} • Last active: {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString() : "Active"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={async () => {
                    try {
                      await authApi.revokeSession(s.id);
                      setSessions((prev) => prev.filter((item) => item.id !== s.id));
                      toast.success("Session revoked.");
                    } catch (err: any) {
                      toast.error(err?.message || "Failed to revoke session");
                    }
                  }}
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
