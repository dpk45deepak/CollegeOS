"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/auth/authStore";
import { useUIStore } from "@/stores/useUIStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { QuickRoleSwitcher } from "./QuickRoleSwitcher";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  Sparkles,
  Check,
  CheckCheck,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user, logout } = useAuthStore();
  const {
    isSidebarOpen,
    toggleSidebar,
    setCommandPaletteOpen,
    toggleCopilot,
  } = useUIStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-16 border-b-3 border-border bg-card sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 select-none">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className={cn(
            "md:hidden w-9 h-9 rounded-xl border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center shadow-[2px_2px_0_var(--edu-border)] transition-colors cursor-pointer",
            isSidebarOpen && "bg-[var(--secondary)] text-slate-900 border-[var(--edu-border)]"
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Button (⌘K) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-border bg-[var(--bg-cream)] hover:bg-card text-xs font-bold text-foreground shadow-[2px_2px_0_var(--edu-border)] transition-all w-48 sm:w-72 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Search courses, records, exams...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg border-2 border-border bg-card text-[10px] font-mono font-bold text-foreground shadow-[1px_1px_0_var(--edu-border)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* Ask AI Copilot Button */}
        <button
          onClick={toggleCopilot}
          className="hidden sm:inline-flex btn-primary text-xs py-2 px-4 gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Ask AI Copilot</span>
        </button>

        {/* Quick Role Switcher */}
        <QuickRoleSwitcher />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--edu-border)] cursor-pointer"
          title={
            mounted
              ? `Theme: ${theme || "system"} (Click to switch to ${resolvedTheme === "dark" ? "Light" : "Dark"})`
              : "Toggle dark mode"
          }
          aria-label="Toggle dark mode"
          suppressHydrationWarning
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 rounded-xl border-2 border-border bg-card text-foreground hover:bg-[var(--secondary)]/30 flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--edu-border)] relative cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border border-card">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-3xl border-3 border-border bg-card p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-display text-foreground">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-300 dark:border-rose-800">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-bold text-[var(--cta-dark)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs font-semibold text-muted-foreground text-center py-6">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-3 rounded-2xl text-xs cursor-pointer transition-colors border-2 ${
                          item.isRead
                            ? "bg-card border-transparent hover:bg-muted text-foreground"
                            : "bg-[var(--accent-mint)]/20 border-border shadow-[2px_2px_0_var(--edu-border)] text-foreground"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-foreground">{item.title}</p>
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px] font-semibold leading-relaxed">
                          {item.message}
                        </p>
                        {item.actionUrl && (
                          <Link
                            href={item.actionUrl}
                            onClick={() => setIsNotifOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--cta-dark)] hover:underline mt-1.5"
                          >
                            View details <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-9 h-9 rounded-xl border-2 border-border bg-[var(--accent-mint)] text-slate-900 flex items-center justify-center font-bold font-display text-sm uppercase shadow-[2px_2px_0_var(--edu-border)] hover:scale-105 transition-all cursor-pointer"
          >
            {user?.name?.charAt(0) || "U"}
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-56 rounded-3xl border-3 border-border bg-card p-2 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b-2 border-border mb-1">
                  <p className="text-xs font-bold font-display text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors"
                >
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  Settings & Theme
                </Link>
                <div className="border-t-2 border-border my-1" />
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
