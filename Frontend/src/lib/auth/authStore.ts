"use client";

import { create } from "zustand";
import { User } from "@/types";
import { authApi } from "../api/auth";
import {
  clearStoredAuth,
  getStoredItem,
  REFRESH_TOKEN_KEY,
  setAuthItems,
  TOKEN_KEY,
  USER_KEY,
} from "../api/client";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAIStore } from "@/stores/useAIStore";

let queryCacheClearer: (() => void) | null = null;

export function registerQueryCacheClearer(fn: () => void): void {
  queryCacheClearer = fn;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (loginId: string, password: string, collegeCode?: string, rememberMe?: boolean) => Promise<User>;
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
      localStorage.removeItem("college_os_demo_mode");
      localStorage.removeItem("college_os_demo_role");

      const savedToken = getStoredItem(TOKEN_KEY);
      const savedUserJson = getStoredItem(USER_KEY);
      const savedRefreshToken = getStoredItem(REFRESH_TOKEN_KEY);

      if (savedToken) {
        let initialUser: User | null = null;
        if (savedUserJson) {
          try {
            initialUser = JSON.parse(savedUserJson);
          } catch {
            // Ignored
          }
        }

        const isSessionOnly =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem(TOKEN_KEY) !== null &&
          (typeof localStorage === "undefined" || localStorage.getItem(TOKEN_KEY) === null);

        set({
          user: initialUser,
          token: savedToken,
          refreshToken: savedRefreshToken,
          isAuthenticated: !!initialUser,
          isLoading: !initialUser,
          isInitialized: !!initialUser,
        });

        // Verify session against real backend /users/me (apiClient performs 401 refresh rotation atomically)
        try {
          const verifiedUser = await authApi.getCurrentUser();
          const latestToken = getStoredItem(TOKEN_KEY) || savedToken;
          const latestRefresh = getStoredItem(REFRESH_TOKEN_KEY) || savedRefreshToken;
          setAuthItems({ [USER_KEY]: JSON.stringify(verifiedUser) }, !isSessionOnly);
          set({
            user: verifiedUser,
            token: latestToken,
            refreshToken: latestRefresh,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          if (status === 401 || status === 403) {
            clearStoredAuth();
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

  login: async (loginId: string, password: string, collegeCode?: string, rememberMe = true) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(loginId, password, collegeCode, rememberMe);
      setAuthItems(
        {
          [USER_KEY]: JSON.stringify(response.user),
          [TOKEN_KEY]: response.token,
          ...(response.refreshToken ? { [REFRESH_TOKEN_KEY]: response.refreshToken } : {}),
        },
        rememberMe
      );
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
    clearStoredAuth();
    try {
      queryCacheClearer?.();
      useNotificationStore.getState().clearAll();
      useAIStore.getState().resetStore();
    } catch {
      // Safe cleanup guard in tests
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
