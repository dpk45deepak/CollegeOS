import { apiClient } from "./client";
import { attendanceApi } from "@/services/api/attendance.api";

export interface TeacherClass {
  id: string;
  offeringId?: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
  time: string;
  enrolledStudents: number;
  attendanceMarked: boolean;
}

export interface StudentRosterItem {
  id: string;
  rollNumber: string;
  name: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  currentAttendancePercent: number;
}

export interface PendingAssignmentItem {
  id: string;
  title: string;
  subject: string;
  dueAt?: string;
  maxMarks?: number;
  attachmentKeys?: string[];
  pendingCount: number;
}

export interface TeacherAtRiskStudent {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  attendance: number;
  reason: string;
}

export const teacherApi = {
  getTodayClasses: async (): Promise<TeacherClass[]> => {
    try {
      const scheduled = await attendanceApi.getTeacherScheduledSessions().catch(() => null);
      if (Array.isArray(scheduled) && (scheduled.length === 0 || "slotId" in scheduled[0])) {
        return scheduled.map((s) => ({
          id: s.subjectOfferingId || s.slotId,
          offeringId: s.subjectOfferingId,
          slotId: s.slotId,
          subjectOfferingId: s.subjectOfferingId,
          subjectCode: s.subject?.code || "Course",
          subjectName: s.subject?.name || "Subject Lecture",
          section: s.section?.name || "A",
          room: s.room?.code || "Room TBD",
          time: `${s.startTime} - ${s.endTime}`,
          enrolledStudents: s.enrolledStudents ?? 0,
          attendanceMarked: Boolean(s.isMarked),
        }));
      }
    } catch {
      // Fall back to weekly timetable / subject offerings only if scheduled-sessions endpoint is unavailable
    }

    try {
      const timetableSlots = await apiClient<any[]>("/timetable/teachers/me").catch(() => null);
      const slots = Array.isArray(timetableSlots)
        ? timetableSlots
        : (timetableSlots as any)?.items || (timetableSlots as any)?.data || [];

      if (Array.isArray(slots) && slots.length > 0) {
        const currentDayIndex = new Date().getDay();
        const shortDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const fullDays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const todayShort = shortDays[currentDayIndex];
        const todayFull = fullDays[currentDayIndex];

        const todaySlots = slots.filter((s: any) => {
          const slotDay = String(s.dayOfWeek || s.day || "").toUpperCase();
          return slotDay === todayShort || slotDay === todayFull;
        });

        if (todaySlots.length > 0) {
          const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
          return todaySlots.map((slot: any) => {
            const offering = slot.subjectOffering || slot.offering || {};
            const startMin = typeof slot.startMinute === "number" ? slot.startMinute : null;
            const endMin = typeof slot.endMinute === "number" ? slot.endMinute : null;
            return {
              id: offering.id || slot.subjectOfferingId || slot.offeringId || slot.id || "",
              slotId: slot.id,
              subjectOfferingId: slot.subjectOfferingId || offering.id || slot.offeringId || slot.id || "",
              subjectCode: offering.subject?.code || slot.subjectCode || "Course",
              subjectName: offering.subject?.name || slot.subjectName || "Subject Lecture",
              section: offering.section?.name || slot.section || "A",
              room: slot.room?.code || slot.room?.number || (typeof slot.room === "string" ? slot.room : "Room Assigned"),
              time:
                slot.time ||
                (startMin !== null && endMin !== null
                  ? `${fmt(startMin)} - ${fmt(endMin)}`
                  : startMin !== null
                    ? fmt(startMin)
                    : "Scheduled"),
              dayOfWeek: slot.dayOfWeek,
              enrolledStudents: offering._count?.enrollments || slot.enrolledStudents || 0,
              attendanceMarked: !!slot.attendanceMarked,
            };
          });
        }
      }
    } catch {
      // Fallback to subject offerings if timetable not yet scheduled
    }

    const raw = await apiClient<any[]>("/subject-offerings");
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];

    if (Array.isArray(items)) {
      return items.map((offering: any) => ({
        id: offering.id || "",
        subjectCode: offering.subject?.code || offering.subjectCode || "Course",
        subjectName: offering.subject?.name || offering.subjectName || "Subject Lecture",
        section: offering.section?.name || offering.section || "A",
        room: offering.defaultRoom?.code || offering.defaultRoom?.number || (typeof offering.defaultRoom === "string" ? offering.defaultRoom : "Room Assigned"),
        time: offering.time || "Scheduled Session",
        enrolledStudents: offering._count?.enrollments || offering.enrolledStudents || 0,
        attendanceMarked: !!offering.attendanceMarked,
      }));
    }

    return [];
  },

  getClassRoster: async (classId: string): Promise<StudentRosterItem[]> => {
    const raw = await apiClient<any[]>(`/subject-offerings/${classId}/students`);
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];

    if (!Array.isArray(items)) return [];

    return items.map((item: any) => {
      if (!item) {
        return {
          id: "",
          rollNumber: "",
          name: "Student",
          status: "PRESENT",
          currentAttendancePercent: 100,
        };
      }
      const st = item.student || item;
      const usr = st.user || item.user;
      const firstName = usr?.firstName || "";
      const lastName = usr?.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const name = fullName || st.name || item.name || usr?.loginId || st.rollNumber || "Student";
      const rollNumber = String(st.rollNumber || item.rollNumber || usr?.loginId || st.collegeStudentId || item.collegeStudentId || "");

      return {
        id: st.id || item.id || "",
        rollNumber,
        name,
        status: (item.status as any) || "PRESENT",
        currentAttendancePercent: typeof item.currentAttendancePercent === "number" ? item.currentAttendancePercent : 100,
      };
    });
  },

  submitAttendance: async (
    classId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[],
    date?: string,
    slotIdOrPeriodKey?: string
  ) => {
    const isSlotId = Boolean(slotIdOrPeriodKey && slotIdOrPeriodKey.length > 16);
    const localDate = date || new Date().toLocaleDateString("en-CA");
    const res = await attendanceApi.mark({
      subjectOfferingId: classId,
      timetableSlotId: isSlotId ? slotIdOrPeriodKey : undefined,
      periodKey: slotIdOrPeriodKey && slotIdOrPeriodKey.length <= 32 ? slotIdOrPeriodKey : undefined,
      date: localDate,
      records,
    });
    return {
      success: true,
      message: `Successfully marked attendance for ${res.created} student(s).${res.skippedAlreadyMarked?.length ? ` (${res.skippedAlreadyMarked.length} already recorded)` : ""}`,
    };
  },

  getPendingAssignmentsToGrade: async (): Promise<PendingAssignmentItem[]> => {
    const raw = await apiClient<any[]>("/assignments", { params: { limit: 100 } });
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];
    return items.map((a: any) => ({
      id: a.id,
      title: a.title,
      subject: a.offering?.subject?.name || a.subjectOffering?.subject?.name || a.subject || "Course",
      dueAt: a.dueAt,
      maxMarks: a.maxMarks ? Number(a.maxMarks) : undefined,
      attachmentKeys: Array.isArray(a.attachmentKeys) ? a.attachmentKeys : [],
      pendingCount: typeof a.pendingCount === "number" ? a.pendingCount : (a._count?.submissions || 0),
    }));
  },

  getMissingSubmissions: async (assignmentId: string): Promise<{ pastDue: boolean; students: Array<{ id: string; rollNumber: string; user?: { firstName: string; lastName: string } }> }> => {
    return apiClient(`/assignments/${assignmentId}/missing`);
  },

  getMyLeaves: async (): Promise<Array<{ id: string; fromDate: string; toDate: string; reason: string; status: string; createdAt: string }>> => {
    const raw = await apiClient<any>("/leave-requests");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getWeeklyTimetable: async () => {
    const raw = await apiClient<any>("/timetable/teachers/me");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createTimetableException: async (dto: {
    slotId: string;
    date: string;
    type: "CANCELLED" | "RESCHEDULED" | "SUBSTITUTED";
    substituteTeacherId?: string;
    overrideRoomId?: string;
    overrideStartMinute?: number;
    overrideEndMinute?: number;
    reason: string;
  }) => {
    return apiClient<any>("/timetable/exceptions", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  removeTimetableException: async (exceptionId: string) => {
    return apiClient<void>(`/timetable/exceptions/${exceptionId}`, { method: "DELETE" });
  },

  getAssignmentSubmissions: async (assignmentId: string): Promise<any[]> => {
    const raw = await apiClient<any>(`/assignments/${assignmentId}/submissions`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAtRiskStudents: async (): Promise<TeacherAtRiskStudent[]> => {
    const raw = await apiClient<any[]>("/attendance/analytics/shortage", { params: { limit: 100 } });
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];
    return items.map((s: any) => {
      const usr = s.user || s.student?.user;
      const pct = s.overall?.percentage ?? s.percentage ?? s.attendance ?? 0;
      const primaryFlag = Array.isArray(s.flags) && s.flags.length > 0 ? s.flags[0] : null;
      return {
        id: s.studentId || s.id,
        name: usr
          ? `${usr.firstName || ""} ${usr.lastName || ""}`.trim() || s.rollNumber || "Student"
          : s.name || "Student",
        rollNumber: s.student?.rollNumber || s.rollNumber || "",
        subject: primaryFlag?.subjectName || s.subjectName || s.subject || "Overall Attendance",
        attendance: pct ?? 0,
        reason: primaryFlag?.detail || s.reason || `Attendance at ${pct ?? 0}% (below 75% threshold)`,
      };
    });
  },

  createAssignment: async (data: {
    subjectOfferingId: string;
    title: string;
    description?: string;
    dueAt: string;
    maxMarks: number;
    attachmentKeys?: string[];
  }) => {
    return apiClient<any>("/assignments", {
      method: "POST",
      body: JSON.stringify({
        subjectOfferingId: data.subjectOfferingId,
        title: data.title,
        description: data.description || "Course Assignment Specification",
        dueAt: new Date(data.dueAt).toISOString(),
        maxMarks: Number(data.maxMarks) || 30,
        attachmentKeys: data.attachmentKeys ?? [],
      }),
    });
  },

  gradeSubmission: async (
    submissionId: string,
    data: { marks: number; feedback?: string }
  ) => {
    return apiClient<any>(`/assignments/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify({
        marks: data.marks,
        feedback: data.feedback || "Evaluated by course faculty.",
      }),
    });
  },

  requestLeave: async (data: { fromDate: string; toDate: string; reason: string }) => {
    return apiClient<any>("/leave-requests", {
      method: "POST",
      body: JSON.stringify({
        fromDate: new Date(data.fromDate).toISOString(),
        toDate: new Date(data.toDate).toISOString(),
        reason: data.reason,
      }),
    });
  },
};