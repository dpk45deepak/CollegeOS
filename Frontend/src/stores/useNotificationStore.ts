"use client";

import { create } from "zustand";
import { NotificationItem } from "@/types";

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) =>
    set({
      notifications: notifications || [],
      unreadCount: (notifications || []).filter((n) => n && !n.isRead).length,
    }),

  addNotification: (notification) =>
    set((state) => {
      const updated = [notification, ...(state.notifications || [])];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => n && !n.isRead).length,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = (state.notifications || []).map((n) =>
        n && n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => n && !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: (state.notifications || []).map((n) => (n ? { ...n, isRead: true } : n)),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
