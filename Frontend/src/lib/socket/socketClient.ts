"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "@/stores/useNotificationStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

// Real-time notification broadcaster and listener
export function useRealtimeSync() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("college_os_token") : null;
    if (!token) return;

    try {
      const socket = io(`${SOCKET_URL}/realtime`, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on("notification.new", (data: any) => {
        addNotification({
          id: data.id || `notif_${Date.now()}`,
          type: data.type || "general",
          title: data.title || "New Notification",
          message: data.message || data.body || "",
          timestamp: "Just now",
          isRead: false,
          actionUrl: data.actionUrl,
        });
      });

      socket.on("attendance.marked", (data: any) => {
        addNotification({
          id: `att_${Date.now()}`,
          type: "attendance_warning",
          title: "Attendance Recorded",
          message: `Attendance was marked for ${data.subjectName || "your class"}.`,
          timestamp: "Just now",
          isRead: false,
          actionUrl: "/student/attendance",
        });
      });

      socket.on("complaint.status", (data: any) => {
        addNotification({
          id: `comp_${Date.now()}`,
          type: "complaint_update",
          title: "Grievance Ticket Updated",
          message: `Ticket #${data.ticketId} status changed to ${data.status}.`,
          timestamp: "Just now",
          isRead: false,
          actionUrl: "/student/complaints",
        });
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // Socket connection fallback
    }
  }, [addNotification]);
}
