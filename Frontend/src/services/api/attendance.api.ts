import { apiClient } from "@/lib/api/client";

export interface AttendanceRecordItem {
  id: string;
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  markedAt: string;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string };
  };
}

export interface AttendanceSession {
  id: string;
  subjectOfferingId: string;
  date: string;
  mode: string;
  records: AttendanceRecordItem[];
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  studentId?: string;
  oldStatus?: "PRESENT" | "ABSENT" | "LATE";
  newStatus?: "PRESENT" | "ABSENT" | "LATE";
  requestedStatus?: "PRESENT" | "ABSENT" | "LATE";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewerNote?: string | null;
  createdAt: string;
  attendance?: {
    id: string;
    status: string;
    date: string;
    session?: { subjectOffering?: { subject?: { name: string; code: string } } };
  };
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string };
  };
}

export interface AttendanceShortageItem {
  studentId: string;
  rollNumber: string;
  studentName: string;
  department: string;
  percentage: number;
  attended: number;
  total: number;
  shortageGap: number;
}

export interface TeacherScheduledSession {
  slotId: string;
  subjectOfferingId: string;
  subject: { id: string; code: string; name: string };
  section: { id: string; name: string };
  semester: { id: string; number: number; academicYear?: string };
  teacher: { id: string; name: string };
  room: { id: string; code: string; capacity?: number } | null;
  date: string;
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
  enrolledStudents: number;
  isMarked: boolean;
  markedCount: number;
  sessionId?: string;
}

export interface SessionRosterStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  email?: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  remark?: string;
  isAlreadyMarked: boolean;
  recordId?: string;
}

export interface ScheduledSessionRosterResponse {
  session: {
    slotId: string;
    subjectOfferingId: string;
    subject: { id: string; code: string; name: string };
    section: { id: string; name: string };
    semester: { id: string; number: number };
    room: { id: string; code: string } | null;
    date: string;
    isMarked: boolean;
    markedCount: number;
    sessionId?: string;
  };
  roster: SessionRosterStudent[];
}

export interface StudentCalendarRecord {
  id: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  periodKey: string;
  remark?: string | null;
  subjectOfferingId?: string;
}

export interface StudentCalendarDay {
  date: string;
  day: number;
  dayOfWeek: string;
  total: number;
  attended: number;
  absent: number;
  late: number;
  records: StudentCalendarRecord[];
}

export interface StudentCalendarResponse {
  month: number;
  year: number;
  monthName: string;
  daysInMonth: number;
  stats: {
    totalClasses: number;
    attended: number;
    absent: number;
    late: number;
    percentage: number;
  };
  dailyBreakdown: Record<string, StudentCalendarDay>;
  subjects: Array<{
    id: string;
    offeringId: string;
    code: string;
    name: string;
    section: string;
  }>;
}

export interface RegisterSession {
  id: string;
  date: string;
  day: number;
  dayOfWeek: string;
  periodKey: string;
  mode: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percentage: number;
}

export interface RegisterStudent {
  studentId: string;
  rollNumber: string;
  name: string;
  email?: string;
  stats: {
    held: number;
    attended: number;
    absent: number;
    late: number;
    percentage: number;
  };
  attendanceBySession: Record<
    string,
    {
      status: "PRESENT" | "ABSENT" | "LATE" | "NOT_MARKED";
      remark?: string | null;
      recordId?: string;
    }
  >;
}

export interface SectionRegisterResponse {
  subjectOffering: {
    id: string;
    subject: { id: string; code: string; name: string };
    section: { id: string; name: string };
    semester: { id: string; number: number; academicYear?: string };
    teacher: { id: string; name: string };
  };
  month: number;
  year: number;
  monthName: string;
  daysInMonth: number;
  sessions: RegisterSession[];
  students: RegisterStudent[];
  summary: {
    totalStudents: number;
    totalLectures: number;
    averagePercentage: number;
    defaultersCount: number;
  };
}

export interface TeacherOfferingItem {
  id: string;
  subject: { code: string; name: string };
  section: { name: string };
  teacher?: { id: string; user?: { firstName: string; lastName: string } };
}

export const attendanceApi = {
  getTeacherScheduledSessions: async (date?: string): Promise<TeacherScheduledSession[]> => {
    const raw = await apiClient<any>("/attendance/teacher/scheduled-sessions", {
      params: date ? { date } : undefined,
    });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getScheduledSessionRoster: async (slotId: string, date?: string): Promise<ScheduledSessionRosterResponse> => {
    return apiClient<ScheduledSessionRosterResponse>(`/attendance/scheduled-sessions/${slotId}/roster`, {
      params: date ? { date } : undefined,
    });
  },

  mark: async (dto: {
    subjectOfferingId: string;
    timetableSlotId?: string;
    periodKey?: string;
    date: string;
    records: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LATE"; remark?: string }>;
    defaultStatus?: "PRESENT" | "ABSENT" | "LATE";
  }) => {
    return apiClient<{ sessionId: string; created: number; skippedAlreadyMarked: string[] }>("/attendance", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getSession: async (subjectOfferingId: string, date: string): Promise<AttendanceSession | null> => {
    return apiClient<AttendanceSession | null>("/attendance/sessions", {
      params: { subjectOfferingId, date },
    });
  },

  requestCorrection: async (dto: {
    attendanceId?: string;
    subjectOfferingId?: string;
    date?: string;
    newStatus: "PRESENT" | "ABSENT" | "LATE";
    reason: string;
  }) => {
    return apiClient<AttendanceCorrection>("/attendance/correction-request", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listCorrections: async (params?: { studentId?: string; page?: number; limit?: number }) => {
    const raw = await apiClient<any>("/attendance/corrections", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getCorrection: async (id: string): Promise<AttendanceCorrection> => {
    return apiClient<AttendanceCorrection>(`/attendance/corrections/${id}`);
  },

  reviewCorrection: async (id: string, dto: { approve: boolean; note?: string }) => {
    return apiClient<any>(`/attendance/corrections/${id}/review`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getStudentReport: async (studentId: string) => {
    return apiClient<any>(`/attendance/students/${studentId}/report`);
  },

  getStudentRecords: async (studentId: string, params?: { subjectOfferingId?: string; from?: string; to?: string }) => {
    return apiClient<any>(`/attendance/students/${studentId}/records`, { params });
  },

  getStudentCalendar: async (params?: {
    month?: number;
    year?: number;
    subjectId?: string;
    studentId?: string;
  }): Promise<StudentCalendarResponse> => {
    return apiClient<StudentCalendarResponse>("/students/me/attendance/calendar", { params });
  },

  getSectionRegister: async (params: {
    subjectOfferingId: string;
    month?: number;
    year?: number;
  }): Promise<SectionRegisterResponse> => {
    return apiClient<SectionRegisterResponse>("/attendance/register", { params });
  },

  getTeacherOfferings: async (params?: { limit?: number }): Promise<TeacherOfferingItem[]> => {
    const raw = await apiClient<any>("/subject-offerings", { params: { limit: params?.limit ?? 100 } });
    return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
  },

  getShortageAnalytics: async (params?: { page?: number; limit?: number }): Promise<AttendanceShortageItem[]> => {
    const raw = await apiClient<any>("/attendance/analytics/shortage", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAnomalies: async () => {
    return apiClient<any>("/attendance/analytics/anomalies");
  },
};

