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
    <header className="h-16 border-b-3 border-[var(--text)] bg-white sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-2 select-none">
      {/* Left: Mobile hamburger & Search trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden w-9 h-9 rounded-xl border-2 border-[var(--text)] bg-white text-[var(--text)] hover:bg-[var(--secondary)] flex items-center justify-center shadow-[2px_2px_0_var(--text)] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Button (⌘K) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-[var(--text)] bg-[var(--bg-cream)] hover:bg-white text-xs font-bold text-[var(--text)] shadow-[2px_2px_0_var(--text)] transition-all w-48 sm:w-72 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">Search courses, records, exams...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg border-2 border-[var(--text)] bg-white text-[10px] font-mono font-bold text-[var(--text)] shadow-[1px_1px_0_var(--text)]">
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
          className="w-9 h-9 rounded-xl border-2 border-[var(--text)] bg-white text-[var(--text)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--text)] cursor-pointer"
          title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 rounded-xl border-2 border-[var(--text)] bg-white text-[var(--text)] hover:bg-[var(--secondary)] flex items-center justify-center transition-colors shadow-[2px_2px_0_var(--text)] relative cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border border-[var(--text)]">
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
              <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-3xl border-3 border-[var(--text)] bg-white p-4 shadow-[6px_6px_0_var(--text)] z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-2 border-b-2 border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-display text-[var(--text)]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-300">
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
                    <p className="text-xs font-semibold text-[var(--text-muted)] text-center py-6">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`p-3 rounded-2xl text-xs cursor-pointer transition-colors border-2 ${
                          item.isRead
                            ? "bg-white border-transparent hover:bg-[var(--bg-cream)] hover:border-[var(--text)]"
                            : "bg-[var(--accent-mint)]/30 border-[var(--text)] shadow-[2px_2px_0_var(--text)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[var(--text)]">{item.title}</p>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] shrink-0">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] mt-1 text-[11px] font-semibold leading-relaxed">
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
            className="w-9 h-9 rounded-xl border-2 border-[var(--text)] bg-[var(--accent-mint)] text-[var(--text)] flex items-center justify-center font-bold font-display text-sm uppercase shadow-[2px_2px_0_var(--text)] hover:scale-105 transition-all cursor-pointer"
          >
            {user?.name?.charAt(0) || "U"}
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-3 w-56 rounded-3xl border-3 border-[var(--text)] bg-white p-2 shadow-[6px_6px_0_var(--text)] z-50 animate-in fade-in zoom-in-95">
                <div className="p-3 border-b-2 border-[var(--border)] mb-1">
                  <p className="text-xs font-bold font-display text-[var(--text)] truncate">{user?.name}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] truncate">{user?.email}</p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text)] hover:bg-[var(--secondary)]/30 transition-colors"
                >
                  <User className="h-4 w-4 text-[var(--text-muted)]" />
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text)] hover:bg-[var(--secondary)]/30 transition-colors"
                >
                  <Moon className="h-4 w-4 text-[var(--text-muted)]" />
                  Settings & Theme
                </Link>
                <div className="border-t-2 border-[var(--border)] my-1" />
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
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
