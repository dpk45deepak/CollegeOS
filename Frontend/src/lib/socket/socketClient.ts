"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { QueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { studentApi } from "@/lib/api/student";
import type { BackendChatResponse } from "@/lib/api/ai";
import { useAuthStore } from "@/lib/auth/authStore";
import { getStoredItem, TOKEN_KEY } from "@/lib/api/client";
import { getPreferences } from "@/lib/preferences";
import { toast } from "sonner";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

let activeSocket: Socket | null = null;
let sharedQueryClient: QueryClient | null = null;

export function registerSocketQueryClient(qc: QueryClient | null) {
  sharedQueryClient = qc;
}

export function subscribeAttendanceOffering(subjectOfferingId: string) {
  if (activeSocket?.connected && subjectOfferingId) {
    activeSocket.emit("attendance.subscribe", { subjectOfferingId });
  }
}

export function streamAiChatOverSocket(params: {
  message: string;
  conversationId?: string;
  studentId?: string;
  onToken?: (token: string) => void;
}): Promise<BackendChatResponse | null> {
  const sock = activeSocket;
  if (!sock || !sock.connected) return Promise.resolve(null);

  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      sock.off("ai.token", onTokenEv);
      sock.off("ai.done", onDoneEv);
      sock.off("ai.error", onErrorEv);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("AI WebSocket response timed out"));
    }, 30_000);

    const onTokenEv = (payload: { requestId?: string; token?: string }) => {
      if (payload?.requestId === requestId && typeof payload.token === "string") {
        params.onToken?.(payload.token);
      }
    };

    const onDoneEv = (payload: BackendChatResponse & { requestId?: string }) => {
      if (payload?.requestId === requestId) {
        cleanup();
        resolve(payload);
      }
    };

    const onErrorEv = (payload: { requestId?: string; message?: string }) => {
      if (payload?.requestId === requestId) {
        cleanup();
        reject(new Error(payload.message || "AI WebSocket error"));
      }
    };

    sock.on("ai.token", onTokenEv);
    sock.on("ai.done", onDoneEv);
    sock.on("ai.error", onErrorEv);
    sock.emit("ai.chat", {
      requestId,
      message: params.message,
      conversationId: params.conversationId,
      studentId: params.studentId,
    });
  });
}

// Detect if running against a serverless host that cannot maintain persistent WebSockets
function isServerlessHost(url?: string): boolean {
  if (!url) return true;
  if (url.includes("vercel.app")) return true;
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    if (!url || url.includes("vercel.app")) return true;
  }
  return false;
}

// Real-time notification & event listener with graceful serverless fallback
export function useRealtimeSync() {
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authToken = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = authToken || (typeof window !== "undefined" ? getStoredItem(TOKEN_KEY) : null);
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        if (activeSocket === socketRef.current) activeSocket = null;
        socketRef.current = null;
      }
      return;
    }

    const fetchLatest = async () => {
      try {
        const notifs = await studentApi.getNotifications();
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        }
      } catch {
        // Safe fallback
      }
    };
    fetchLatest();

    const serverless = isServerlessHost(SOCKET_URL);
    if (serverless) {
      const interval = setInterval(fetchLatest, 45000);
      return () => clearInterval(interval);
    }

    try {
      const socket = io(`${SOCKET_URL}/realtime`, {
        auth: { token },
        transports: ["polling", "websocket"],
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        autoConnect: true,
      });
      socketRef.current = socket;
      activeSocket = socket;

      socket.on("connect_error", () => {
        // Silent fallback
      });

      const handleNotification = (data: any) => {
        const msgText = data?.body || data?.message || "";
        addNotification({
          id: data?.id || `notif_${Date.now()}`,
          type: data?.type || "general",
          title: data?.title || "New Notification",
          message: msgText,
          timestamp: "Just now",
          isRead: false,
          actionUrl: data?.actionUrl || data?.data?.actionUrl,
          data: data?.data && typeof data.data === "object" ? data.data : undefined,
        });
        if (getPreferences().attendanceAlerts && String(data?.type || "").toLowerCase().includes("attendance")) {
          toast.warning(data?.title || "Attendance Alert", { description: msgText });
        }
      };

      // Backend emits `notification`; keep `notification.new` alias for backwards compatibility
      socket.on("notification", handleNotification);
      socket.on("notification.new", handleNotification);

      socket.on("attendance.marked", (data: any) => {
        const msg =
          typeof data?.created === "number"
            ? `${data.created} attendance record(s) marked (${data.date || "today"}).`
            : `Attendance was marked for ${data?.subjectName || "class"}.`;
        addNotification({
          id: `att_${Date.now()}`,
          type: "attendance_warning",
          title: "Attendance Recorded",
          message: msg,
          timestamp: "Just now",
          isRead: false,
          actionUrl: "/student/attendance",
        });
        sharedQueryClient?.invalidateQueries({ queryKey: ["scheduled_session_roster"] });
        sharedQueryClient?.invalidateQueries({ queryKey: ["teacher_scheduled_sessions"] });
        sharedQueryClient?.invalidateQueries({ queryKey: ["student_attendance"] });
      });

      socket.on("complaint.status", (data: any) => {
        const ticketLabel = data?.ticketNo || data?.ticketId || data?.complaintId || "Grievance";
        addNotification({
          id: `comp_${Date.now()}`,
          type: "complaint_update",
          title: "Grievance Ticket Updated",
          message: `Ticket #${ticketLabel} status changed to ${data?.status || "UPDATED"}.`,
          timestamp: "Just now",
          isRead: false,
          actionUrl: "/student/complaints",
        });
        sharedQueryClient?.invalidateQueries({ queryKey: ["my_complaints"] });
        sharedQueryClient?.invalidateQueries({ queryKey: ["complaint_queue"] });
        sharedQueryClient?.invalidateQueries({ queryKey: ["support_complaints"] });
      });

      socket.on("message", (data: any) => {
        if (data?.conversationId) {
          sharedQueryClient?.invalidateQueries({ queryKey: ["messages", data.conversationId] });
        }
        sharedQueryClient?.invalidateQueries({ queryKey: ["messages"] });
        sharedQueryClient?.invalidateQueries({ queryKey: ["conversations"] });
        toast.info("New Direct Message", {
          description: data?.message?.content ? String(data.message.content).slice(0, 80) : "You received a new message.",
        });
      });

      socket.on("announcement", (data: any) => {
        addNotification({
          id: `ann_${data?.noticeId || Date.now()}`,
          type: "general",
          title: data?.title || "New Campus Announcement",
          message: "A new notice has been published to your campus feed.",
          timestamp: "Just now",
          isRead: false,
          actionUrl: "/notices",
        });
        sharedQueryClient?.invalidateQueries({ queryKey: ["notices"] });
        toast.info(data?.title || "Campus Announcement");
      });

      return () => {
        socket.disconnect();
        if (activeSocket === socket) activeSocket = null;
        if (socketRef.current === socket) socketRef.current = null;
      };
    } catch {
      // Silent socket fallback
    }
  }, [addNotification, authToken, isAuthenticated, setNotifications]);
}
