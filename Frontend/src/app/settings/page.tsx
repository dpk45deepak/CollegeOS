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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [citationVerbosity, setCitationVerbosity] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} className="text-xs shadow-md shadow-brand-500/20">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
