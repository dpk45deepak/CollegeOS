"use client";

import { create } from "zustand";
import { User, UserRole } from "@/types";
import { mockUsers } from "../api/mockData";
import { authApi } from "../api/auth";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: mockUsers.student,
  token: "demo_token_init",
  isAuthenticated: true,
  isLoading: false,

  initialize: () => {
    if (typeof window === "undefined") return;
    try {
      const savedUser = localStorage.getItem("college_os_user");
      const savedToken = localStorage.getItem("college_os_token");
      if (savedUser && savedToken) {
        set({
          user: JSON.parse(savedUser),
          token: savedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Default to student in demo mode
        const defaultUser = mockUsers.student;
        localStorage.setItem("college_os_user", JSON.stringify(defaultUser));
        localStorage.setItem("college_os_token", "demo_token_default");
        set({
          user: defaultUser,
          token: "demo_token_default",
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch {
      set({ user: mockUsers.student, isAuthenticated: true, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      if (typeof window !== "undefined") {
        localStorage.setItem("college_os_user", JSON.stringify(response.user));
        localStorage.setItem("college_os_token", response.token);
      }
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return response.user;
    } finally {
      set({ isLoading: false });
    }
  },

  switchDemoRole: (role: UserRole) => {
    const response = authApi.switchRole(role);
    if (typeof window !== "undefined") {
      localStorage.setItem("college_os_user", JSON.stringify(response.user));
      localStorage.setItem("college_os_token", response.token);
    }
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("college_os_user");
      localStorage.removeItem("college_os_token");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));
