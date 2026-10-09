"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { FloatingCopilotButton } from "./FloatingCopilotButton";
import { AICopilotDrawer } from "@/components/ai/AICopilotDrawer";
import { CommandPalette } from "@/components/search/CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Standalone pages that do not use the ERP sidebar/topbar shell
  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-cream)]">
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

      {/* Global AI Copilot Floating Drawer & Button */}
      <FloatingCopilotButton />
      <AICopilotDrawer />
      <CommandPalette />
    </div>
  );
}
