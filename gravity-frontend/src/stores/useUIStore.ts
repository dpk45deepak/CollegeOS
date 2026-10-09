"use client";

import { create } from "zustand";

interface UIStore {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isCommandPaletteOpen: boolean;
  isCopilotOpen: boolean;
  theme: "light" | "dark" | "system";
  activeFilter: string;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  isCommandPaletteOpen: false,
  isCopilotOpen: false,
  theme: "light",
  activeFilter: "all",

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setCopilotOpen: (open) => set({ isCopilotOpen: open }),
  toggleCopilot: () => set((state) => ({ isCopilotOpen: !state.isCopilotOpen })),
  setTheme: (theme) => set({ theme }),
}));
