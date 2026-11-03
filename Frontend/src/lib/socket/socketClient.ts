"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { studentApi } from "@/lib/api/student";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

// Detect if running against a serverless host that cannot maintain persistent WebSockets
function isServerlessHost(url?: string): boolean {
  if (!url) return true;
  // Vercel serverless domains do not support persistent WebSockets
  if (url.includes("vercel.app")) return true;
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    if (!url || url.includes("vercel.app")) return true;
  }
  return false;
}

// Real-time notification broadcaster and listener with graceful serverless fallback
export function useRealtimeSync() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("college_os_token") : null;
    if (!token) return;

    // 1. Initial notification fetch via REST API
    const fetchLatest = async () => {
      try {
        const notifs = await studentApi.getNotifications();
        if (Array.isArray(notifs) && notifs.length > 0) {
          setNotifications(notifs);
        }
      } catch {
        // Safe fallback
      }
    };
    fetchLatest();

    // 2. Determine whether to connect via WebSocket or fall back to periodic HTTP polling
    const serverless = isServerlessHost(SOCKET_URL);

    if (serverless) {
      // In serverless environments (e.g. Vercel), persistent WebSockets are not supported.
      // Use efficient background HTTP polling every 45 seconds to avoid websocket errors.
      const interval = setInterval(fetchLatest, 45000);
      return () => clearInterval(interval);
    }

    // 3. For dedicated Node.js / standalone servers supporting WebSockets:
    try {
      const socket = io(`${SOCKET_URL}/realtime`, {
        auth: { token },
        transports: ["polling", "websocket"],
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        autoConnect: true,
      });
      socketRef.current = socket;

      // Silently catch connection errors without console error spam
      socket.on("connect_error", () => {
        // Silent fallback - no red error logs in browser
      });

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
      // Silent socket fallback
    }
  }, [addNotification, setNotifications]);
}
