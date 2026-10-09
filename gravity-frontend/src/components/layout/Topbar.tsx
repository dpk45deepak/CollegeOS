"use client";

import React, { useState } from "react";
import Link from "next/link";
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

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, setCommandPaletteOpen, toggleCopilot } = useUIStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Button (⌘K) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs text-muted-foreground transition-all w-44 sm:w-64 justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Search records, files, exams...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono font-medium text-muted-foreground shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Ask AI Copilot Button */}
        <button
          onClick={toggleCopilot}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Ask AI Copilot</span>
        </button>

        {/* Quick Role Switcher */}
        <QuickRoleSwitcher />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          item.isRead
                            ? "bg-transparent hover:bg-muted/50"
                            : "bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/50 dark:border-brand-800/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground">{item.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                          {item.message}
                        </p>
                        {item.actionUrl && (
                          <Link
                            href={item.actionUrl}
                            onClick={() => setIsNotifOpen(false)}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-600 hover:underline mt-1.5"
                          >
                            View details <ExternalLink className="h-2.5 w-2.5" />
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
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted text-foreground transition-colors"
                >
                  <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  Settings & Theme
                </Link>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
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
