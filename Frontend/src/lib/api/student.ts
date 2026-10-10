import { apiClient } from "./client";
import {
  AttendanceSummary,
  TimetableSlot,
  Assignment,
  Exam,
  SemesterResult,
  FeeItem,
  Scholarship,
  PlacementOpportunity,
  Complaint,
  Notice,
  CollegeDocument,
  NotificationItem,
} from "@/types";

// Mapping helper for day of week
const DAY_MAP: Record<string, TimetableSlot["day"]> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
};

export interface BackendSubjectAttendance {
  subjectId: string;
  subjectName?: string;
  attended: number;
  total: number;
  percentage: number | null;
  health: string;
  classesNeeded: number | null;
  canMiss: number;
}

export interface BackendAttendanceReport {
  studentId: string;
  threshold: number;
  overall: BackendSubjectAttendance;
  subjects: BackendSubjectAttendance[];
  flags: Array<{ type: string; detail: string; subjectName?: string }>;
}

export interface StudentDashboardData {
  studentId: string;
  attendance: {
    overall?: BackendSubjectAttendance;
    threshold?: number;
    flags?: Array<{ type: string; detail: string }>;
    worstSubjects?: BackendSubjectAttendance[];
  };
  todaysClasses: any[];
  assignmentsDue: any[];
  upcomingExams: any[];
  fees: { outstanding: number; next: string | null };
  notices: any[];
  events: any[];
  placementMatches: any[];
  scholarships: { possible: number };
  complaints: { open: number };
  academicInsight: { level: string; reasons: string[]; confidence: number };
  unreadNotifications: number;
}

export const studentApi = {
  getDashboard: async (): Promise<StudentDashboardData> => {
    return apiClient<StudentDashboardData>("/students/me/dashboard");
  },

  getAttendance: async (): Promise<AttendanceSummary> => {
    const raw = await apiClient<BackendAttendanceReport | AttendanceSummary>(
      "/students/me/attendance"
    );

    // Normalize from NestJS StudentAttendanceReport if received from live backend
    if (raw && "overall" in raw && raw.overall) {
      const report = raw as BackendAttendanceReport;
      const threshold = report.threshold ?? 75;

      return {
        overallPercentage: report.overall?.percentage ?? 0,
        requiredPercentage: threshold,
        totalHeld: report.overall?.total ?? 0,
        totalAttended: report.overall?.attended ?? 0,
        subjects: (report.subjects || []).map((s) => {
          const parts = (s.subjectName || s.subjectId).split(" - ");
          const code = parts.length > 1 ? parts[0] : s.subjectId;
          const name = parts.length > 1 ? parts[1] : s.subjectName || s.subjectId;

          return {
            id: s.subjectId,
            code,
            name,
            instructor: "Faculty",
            totalClasses: s.total ?? 0,
            attended: s.attended ?? 0,
            absent: Math.max(0, (s.total ?? 0) - (s.attended ?? 0)),
            late: 0,
            percentage: s.percentage ?? 0,
            requiredPercentage: threshold,
            safeToMiss: s.canMiss ?? 0,
            needToAttend: s.classesNeeded ?? 0,
            history: [],
          };
        }),
        trend: [],
      };
    }

    return raw as AttendanceSummary;
  },

  getTimetable: async (): Promise<TimetableSlot[]> => {
    const raw = await apiClient<any[]>("/students/me/timetable");

    if (Array.isArray(raw) && raw.length > 0 && "dayOfWeek" in raw[0]) {
      return raw.map((slot) => ({
        id: slot.id,
        day: DAY_MAP[slot.dayOfWeek] || "Monday",
        startTime: slot.startTime,
        endTime: slot.endTime,
        subjectCode: slot.subject?.code || slot.subjectCode || "GEN101",
        subjectName: slot.subject?.name || slot.subjectName || "Course Lecture",
        room: slot.room?.number || slot.room || "Room Assigned",
        instructor: slot.teacher?.user
          ? `${slot.teacher.user.firstName} ${slot.teacher.user.lastName}`.trim()
          : slot.instructor || "Faculty Assigned",
        type: (slot.type as "Lecture" | "Lab" | "Tutorial") || "Lecture",
      }));
    }

    return Array.isArray(raw) ? (raw as TimetableSlot[]) : [];
  },

  getAssignments: async (): Promise<Assignment[]> => {
    const raw = await apiClient<any>("/students/me/assignments");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

    if (items.length > 0 && ("offering" in items[0] || "subjectOffering" in items[0] || "title" in items[0])) {
      return items.map((a: any) => ({
        id: a.id,
        subjectCode: a.subjectOffering?.subject?.code || a.offering?.subject?.code || a.subjectCode || "Course",
        subjectName: a.subjectOffering?.subject?.name || a.offering?.subject?.name || a.subjectName || a.title,
        title: a.title,
        description: a.description || "",
        teacherName: a.subjectOffering?.teacher?.user
          ? `${a.subjectOffering.teacher.user.firstName} ${a.subjectOffering.teacher.user.lastName}`.trim()
          : a.offering?.teacher?.user
          ? `${a.offering.teacher.user.firstName} ${a.offering.teacher.user.lastName}`.trim()
          : a.teacherName || "Faculty Instructor",
        dueDate: a.dueAt ? new Date(a.dueAt).toISOString().split("T")[0] : a.dueDate || "",
        totalMarks: a.maxMarks || a.maxScore || a.totalMarks || 100,
        status: (a.submission?.status || a.submissions?.[0]?.status as any) || a.status || "PENDING",
        obtainedMarks: a.submission?.marks ?? a.submissions?.[0]?.score ?? a.obtainedMarks,
        feedback: a.submission?.feedback ?? a.submissions?.[0]?.feedback ?? a.feedback,
      }));
    }

    return Array.isArray(items) ? (items as Assignment[]) : [];
  },

  submitAssignment: async (assignmentId: string, fileData: { fileName: string; size: string }) => {
    return apiClient<{ success: boolean; message: string }>(
      `/assignments/${assignmentId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          fileName: fileData.fileName,
          fileUrl: `https://storage.college.os/assignments/${assignmentId}/${fileData.fileName}`,
        }),
      }
    );
  },

  getExams: async (): Promise<Exam[]> => {
    const raw = await apiClient<any[]>("/students/me/exams");

    if (Array.isArray(raw) && raw.length > 0 && "offering" in raw[0]) {
      return raw.map((e: any) => ({
        id: e.id,
        subjectCode: e.offering?.subject?.code || "Course",
        subjectName: e.offering?.subject?.name || "Course Exam",
        examType: (e.type as "Mid-Term" | "End-Term" | "Practical") || "Mid-Term",
        date: e.date ? new Date(e.date).toISOString().split("T")[0] : "",
        startTime: e.startTime || "",
        endTime: e.endTime || "",
        room: e.room?.number || "Hall Assigned",
        seatNumber: "Allocated at Gate",
        maxMarks: e.maxMarks || 100,
        syllabus: "Assigned Syllabus",
        status: (new Date(e.date || Date.now()) > new Date() ? "UPCOMING" : "COMPLETED") as "UPCOMING" | "COMPLETED",
      }));
    }

    return Array.isArray(raw) ? (raw as Exam[]) : [];
  },

  getResults: async (): Promise<SemesterResult> => {
    return apiClient<SemesterResult>("/students/me/results");
  },

  getFees: async (): Promise<FeeItem> => {
    const raw = await apiClient<any>("/students/me/fees");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

    if (items.length > 0) {
      const primary = items[0];
      const totalAmount = items.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      const paidAmount = items.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
      const pendingAmount = items.reduce((sum: number, f: any) => sum + (f.outstanding || 0), 0);

      const breakdown = (primary.feeStructure?.components || []).map((c: any) => ({
        head: c.name || c.head || "Tuition & Academic Fees",
        amount: c.amount || 0,
      }));

      const transactions = (primary.payments || []).map((p: any) => ({
        id: p.id,
        date: p.paidAt ? new Date(p.paidAt).toISOString().split("T")[0] : "",
        amount: p.amount || 0,
        receiptNo: p.receiptNo || "RCP-ONLINE",
        method: "Online Gateway",
        status: (p.status === "SUCCESS" ? "SUCCESS" : "PENDING") as "SUCCESS" | "PENDING",
      }));

      return {
        id: primary.id,
        semester: 6,
        academicYear: primary.feeStructure?.academicYear || "2025-2026",
        totalAmount,
        paidAmount,
        pendingAmount,
        dueDate: primary.dueDate ? new Date(primary.dueDate).toISOString().split("T")[0] : "",
        status: (pendingAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING") as any,
        breakdown: breakdown.length > 0 ? breakdown : [{ head: primary.feeStructure?.name || "Semester Academic Fee", amount: totalAmount }],
        transactions,
      };
    }

    return {
      id: "fee_current",
      semester: 6,
      academicYear: "2025-2026",
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      dueDate: "",
      status: "PAID",
      breakdown: [],
      transactions: [],
    };
  },

  payFee: async (amount: number) => {
    return apiClient<{ success: boolean; transactionId: string }>(
      "/fees/pay",
      {
        method: "POST",
        body: JSON.stringify({
          gateway: "RAZORPAY",
          amount,
        }),
      }
    );
  },

  getScholarships: async (): Promise<Scholarship[]> => {
    const raw = await apiClient<any>("/scholarships");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as Scholarship[];
  },

  applyScholarship: async (scholarshipId: string) => {
    return apiClient<{ success: boolean; message: string }>(
      `/scholarships/${scholarshipId}/apply`,
      { method: "POST" }
    );
  },

  getPlacements: async (): Promise<PlacementOpportunity[]> => {
    const raw = await apiClient<any>("/placements/jobs");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as PlacementOpportunity[];
  },

  applyPlacement: async (placementId: string) => {
    return apiClient<{ success: boolean; message: string }>(
      `/placements/jobs/${placementId}/apply`,
      { method: "POST" }
    );
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const raw = await apiClient<any>("/complaints/my");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as Complaint[];
  },

  createComplaint: async (data: {
    category: Complaint["category"];
    subject: string;
    description: string;
  }) => {
    return apiClient<Complaint>(
      "/complaints",
      {
        method: "POST",
        body: JSON.stringify({
          title: data.subject,
          description: data.description,
          category: data.category,
        }),
      }
    );
  },

  getNotices: async (): Promise<Notice[]> => {
    const raw = await apiClient<any>("/campus/notices");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as Notice[];
  },

  getDocuments: async (): Promise<CollegeDocument[]> => {
    const raw = await apiClient<any>("/documents");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as CollegeDocument[];
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    const raw = await apiClient<any>("/notifications");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items as NotificationItem[];
  },
};
