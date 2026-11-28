"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/authStore";
import { getRoleHomePath, isAuthorizedForPath } from "@/lib/roles";
import { UserRole } from "@/types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { FloatingCopilotButton } from "./FloatingCopilotButton";
import { AICopilotDrawer } from "@/components/ai/AICopilotDrawer";
import { CommandPalette } from "@/components/search/CommandPalette";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/about",
  "/academics",
  "/admissions",
  "/contact",
  "/research",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuthStore();

  const isPublicPage =
    !pathname ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_ROUTES.includes(pathname);

  // If unauthenticated user tries to visit a protected route, stop them and redirect to /login
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isPublicPage) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isInitialized, isAuthenticated, isPublicPage, pathname, router]);

  // If already authenticated user visits /login, redirect to their home portal
  useEffect(() => {
    if (isInitialized && isAuthenticated && user && pathname === "/login") {
      router.replace(getRoleHomePath(user.role));
    }
  }, [isInitialized, isAuthenticated, user, pathname, router]);

  // Standalone public pages that do not use the ERP sidebar/topbar shell
  if (isPublicPage) {
    return (
      <main className="min-h-screen bg-background">
        {children}
      </main>
    );
  }

  // While checking institutional session, render an accessible loading state
  if (!isInitialized) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-cream)] gap-3 p-4">
        <div className="w-12 h-12 rounded-2xl bg-brand-500 border-2 border-black flex items-center justify-center shadow-[4px_4px_0_#000] animate-bounce">
          <span className="font-bold text-white text-xl">🎓</span>
        </div>
        <p className="text-sm font-bold text-foreground font-display">
          Verifying institutional credentials...
        </p>
      </main>
    );
  }

  // Block rendering protected pages if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-cream)] gap-3 p-4">
        <div className="text-center space-y-2">
          <p className="text-sm font-bold text-foreground font-display">
            Authentication Required
          </p>
          <p className="text-xs text-muted-foreground">
            Redirecting to institutional login...
          </p>
        </div>
      </main>
    );
  }

  // Check role-based route permissions
  const authorized = isAuthorizedForPath(pathname, user.role, user);
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-cream)] p-4">
        <div className="p-8 max-w-md w-full mx-auto text-center rounded-2xl border-2 border-border bg-card shadow-sm space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your institutional account with role{" "}
              <strong className="text-foreground">{user.role}</strong> does not have permission to access the requested route (
              <span className="font-mono text-[11px]">{pathname}</span>).
            </p>
          </div>
          <Button
            onClick={() => router.push(getRoleHomePath(user.role))}
            className="text-xs gap-1.5 w-full shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to My Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-cream)]">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main View Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Topbar */}
          <Topbar />

          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </div>
      </div>

      {/* Global AI Copilot Floating Drawer & Button */}
      <FloatingCopilotButton />
      <AICopilotDrawer />
      <CommandPalette />
    </div>
  );
}
