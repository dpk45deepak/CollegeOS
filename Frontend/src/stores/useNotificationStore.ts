"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { NotificationItem } from "@/types";
import { notificationsApi } from "@/services/api/notifications.api";

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

function isNotificationRead(n: NotificationItem | undefined): boolean {
  if (!n) return true;
  if (typeof n.isRead === "boolean") return n.isRead;
  return Boolean((n as { readAt?: string | null }).readAt);
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const normalized = (notifications || []).map((n) => ({
      ...n,
      isRead: isNotificationRead(n),
    }));
    set({
      notifications: normalized,
      unreadCount: normalized.filter((n) => n && !n.isRead).length,
    });
  },

  addNotification: (notification) =>
    set((state) => {
      const normalized = { ...notification, isRead: isNotificationRead(notification) };
      const updated = [normalized, ...(state.notifications || [])];
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => n && !n.isRead).length,
      };
    }),

  markAsRead: (id) => {
    const previous = get().notifications;
    const prevCount = get().unreadCount;
    set((state) => {
      const updated = (state.notifications || []).map((n) =>
        n && n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => n && !n.isRead).length,
      };
    });
    notificationsApi.markRead([id]).catch((err: any) => {
      set({ notifications: previous, unreadCount: prevCount });
      toast.error(err?.message || "Failed to update notification state");
    });
  },

  markAllAsRead: () => {
    const previous = get().notifications;
    const prevCount = get().unreadCount;
    set((state) => ({
      notifications: (state.notifications || []).map((n) => (n ? { ...n, isRead: true } : n)),
      unreadCount: 0,
    }));
    notificationsApi.markRead().catch((err: any) => {
      set({ notifications: previous, unreadCount: prevCount });
      toast.error(err?.message || "Failed to mark notifications read");
    });
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
