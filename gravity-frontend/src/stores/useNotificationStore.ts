"use client";

import { create } from "zustand";
import { NotificationItem } from "@/types";
import { mockNotifications } from "../lib/api/mockData";

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.isRead).length,

  addNotification: (notification) =>
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
