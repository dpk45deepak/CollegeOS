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
    const raw = await apiClient<any[]>("/subject-offerings");
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];

    if (items.length > 0 && ("subject" in items[0] || "section" in items[0])) {
      return items.map((offering: any) => ({
        id: offering.id,
        subjectCode: offering.subject?.code || "Course",
        subjectName: offering.subject?.name || "Subject Lecture",
        section: offering.section?.name || "A",
        room: offering.defaultRoom?.code || offering.defaultRoom?.number || (typeof offering.defaultRoom === "string" ? offering.defaultRoom : "Room Assigned"),
        time: "Scheduled Session",
        enrolledStudents: offering._count?.enrollments || 0,
        attendanceMarked: false,
      }));
    }

    return Array.isArray(items) ? (items as TeacherClass[]) : [];
  },

  getClassRoster: async (classId: string): Promise<StudentRosterItem[]> => {
    const raw = await apiClient<any[]>(`/subject-offerings/${classId}/students`);
    const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.data || [];

    if (Array.isArray(items) && items.length > 0 && "student" in items[0]) {
      return items.map((item: any) => ({
        id: item.student?.id || item.id,
        rollNumber: item.student?.rollNumber || item.student?.user?.loginId || item.rollNumber || "",
        name: item.student?.user
          ? `${item.student.user.firstName} ${item.student.user.lastName}`.trim()
          : item.name || "Student",
        status: "PRESENT",
        currentAttendancePercent: 100,
      }));
    }

    return Array.isArray(items) ? (items as StudentRosterItem[]) : [];
  },

  submitAttendance: async (
    classId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[],
    date?: string
  ) => {
    return apiClient<{ success: boolean; message: string }>(
      "/attendance",
      {
        method: "POST",
        body: JSON.stringify({
          subjectOfferingId: classId,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
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
      subject: a.offering?.subject?.name || a.subject || "Course",
      pendingCount: a._count?.submissions || 0,
    }));
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
  }) => {
    return apiClient<any>("/assignments", {
      method: "POST",
      body: JSON.stringify({
        subjectOfferingId: data.subjectOfferingId,
        title: data.title,
        description: data.description || "Course Assignment Specification",
        dueAt: new Date(data.dueAt).toISOString(),
        maxMarks: data.maxMarks,
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