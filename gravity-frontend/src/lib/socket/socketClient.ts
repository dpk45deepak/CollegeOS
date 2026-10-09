"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/stores/useNotificationStore";

// Real-time notification broadcaster and listener
export function useRealtimeSync() {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    // In demo / client mode, schedule periodic subtle live signals (e.g. simulated real-time event)
    const timer = setTimeout(() => {
      // Simulating a real-time event like teacher posting attendance or urgent notice
      addNotification({
        id: `rt_${Date.now()}`,
        type: "attendance_warning",
        title: "Live Attendance Update",
        message: "Dr. Vikram Sharma marked attendance for CS601 (Lecture 46). Your attendance is now 71.7%.",
        timestamp: "Just now",
        isRead: false,
        actionUrl: "/student/attendance",
      });
    }, 45000); // 45 seconds after load

    return () => clearTimeout(timer);
  }, [addNotification]);
}
