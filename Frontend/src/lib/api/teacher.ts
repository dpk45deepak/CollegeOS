import { apiClient } from "./client";

export interface TeacherClass {
  id: string;
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
      const timetableSlots = await apiClient<any[]>("/timetable/teachers/me").catch(() => null);
      const slots = Array.isArray(timetableSlots)
        ? timetableSlots
        : (timetableSlots as any)?.items || (timetableSlots as any)?.data || [];

      if (Array.isArray(slots) && slots.length > 0) {
        const currentDayIndex = new Date().getDay();
        const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
        const todayName = days[currentDayIndex];

        const todaySlots = slots.filter((s: any) => {
          const slotDay = String(s.dayOfWeek || s.day || "").toUpperCase();
          return slotDay === todayName;
        });

        if (todaySlots.length > 0) {
          return todaySlots.map((slot: any) => ({
            id: slot.id || slot.offeringId || "",
            subjectCode: slot.offering?.subject?.code || slot.subjectCode || "Course",
            subjectName: slot.offering?.subject?.name || slot.subjectName || "Subject Lecture",
            section: slot.offering?.section?.name || slot.section || "A",
            room: slot.room?.code || slot.room?.number || (typeof slot.room === "string" ? slot.room : "Room Assigned"),
            time: slot.time || `${slot.startMinute ? Math.floor(slot.startMinute / 60) + ':' + String(slot.startMinute % 60).padStart(2, '0') : 'Scheduled'}`,
            enrolledStudents: slot.offering?._count?.enrollments || slot.enrolledStudents || 0,
            attendanceMarked: !!slot.attendanceMarked,
          }));
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
    periodKey?: string
  ) => {
    return apiClient<{ success: boolean; message: string }>(
      "/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          subjectOfferingId: classId,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          periodKey: periodKey || "LEC_1",
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
          })),
        }),
      }
    );
  },

  getPendingAssignmentsToGrade: async (): Promise<PendingAssignmentItem[]> => {
    const raw = await apiClient<any[]>("/assignments");
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];
    return items.map((a: any) => ({
      id: a.id,
      title: a.title,
      subject: a.offering?.subject?.name || a.subjectOffering?.subject?.name || a.subject || "Course",
      pendingCount: a._count?.submissions || 0,
    }));
  },

  getAssignmentSubmissions: async (assignmentId: string): Promise<any[]> => {
    const raw = await apiClient<any>(`/assignments/${assignmentId}/submissions`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAtRiskStudents: async (): Promise<TeacherAtRiskStudent[]> => {
    const raw = await apiClient<any[]>("/attendance/analytics/shortage");
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];
    return items.map((s: any) => ({
      id: s.studentId || s.id,
      name: s.student?.user
        ? `${s.student.user.firstName} ${s.student.user.lastName}`.trim()
        : s.name || "Student",
      rollNumber: s.student?.rollNumber || s.rollNumber || "",
      subject: s.subjectName || s.subject || "Course",
      attendance: s.percentage ?? s.attendance ?? 0,
      reason: s.reason || `Attendance below 75% threshold (${s.percentage ?? 0}%)`,
    }));
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