"use client";

import { create } from "zustand";
import { User } from "@/types";
import { authApi } from "../api/auth";

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (loginId: string, password: string, collegeCode?: string) => Promise<User>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    if (typeof window === "undefined") return;

    try {
      // Clean up any legacy demo keys
      localStorage.removeItem("college_os_demo_mode");
      localStorage.removeItem("college_os_demo_role");

      const savedToken = localStorage.getItem("college_os_token");
      const savedUserJson = localStorage.getItem("college_os_user");
      const savedRefreshToken = localStorage.getItem("college_os_refresh_token");

      if (savedToken) {
        let initialUser: User | null = null;
        if (savedUserJson) {
          try {
            initialUser = JSON.parse(savedUserJson);
          } catch {
            // Ignored
          }
        }

        // Hydrate from localStorage first to prevent flash of unauthenticated content
        set({
          user: initialUser,
          token: savedToken,
          refreshToken: savedRefreshToken,
          isAuthenticated: !!initialUser,
          isLoading: true,
        });

        // Verify session against real backend /users/me
        try {
          const verifiedUser = await authApi.getCurrentUser();
          localStorage.setItem("college_os_user", JSON.stringify(verifiedUser));
          set({
            user: verifiedUser,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          if (status === 401 && savedRefreshToken) {
            // Attempt token refresh
            try {
              const rotated = await authApi.refresh(savedRefreshToken);
              localStorage.setItem("college_os_token", rotated.accessToken);
              localStorage.setItem("college_os_refresh_token", rotated.refreshToken);
              const reloaded = await authApi.getCurrentUser();
              set({
                user: reloaded,
                token: rotated.accessToken,
                refreshToken: rotated.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
              });
              return;
            } catch {
              // Refresh failed
            }
          }

          // Invalidate session if backend rejected token
          if (status === 401 || status === 403) {
            localStorage.removeItem("college_os_token");
            localStorage.removeItem("college_os_refresh_token");
            localStorage.removeItem("college_os_user");
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            // Transient offline state: keep current state and stop loading
            set({ isLoading: false, isInitialized: true });
          }
        }
      } else {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async (loginId: string, password: string, collegeCode?: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(loginId, password, collegeCode);
      if (typeof window !== "undefined") {
        localStorage.removeItem("college_os_demo_mode");
        localStorage.removeItem("college_os_demo_role");
        localStorage.setItem("college_os_user", JSON.stringify(response.user));
        localStorage.setItem("college_os_token", response.token);
        if (response.refreshToken) {
          localStorage.setItem("college_os_refresh_token", response.refreshToken);
        }
      }
      set({
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken || null,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
      return response.user;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignored on logout
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("college_os_user");
      localStorage.removeItem("college_os_token");
      localStorage.removeItem("college_os_refresh_token");
      localStorage.removeItem("college_os_demo_mode");
      localStorage.removeItem("college_os_demo_role");
    }
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    });
  },
}));
