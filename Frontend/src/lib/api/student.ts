import { apiClient } from "./client";
import {
  AttendanceSummary,
  TimetableSlot,
  Assignment,
  Exam,
  SemesterResult,
  ResultItem,
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

    if (Array.isArray(raw)) {
      return raw.map((slot) => {
        const subject = slot.subjectOffering?.subject || slot.subject;
        const teacher = slot.subjectOffering?.teacher?.user || slot.teacher?.user;
        const roomStr =
          typeof slot.room === "string"
            ? slot.room
            : slot.room?.code || slot.room?.number || "Room Assigned";

        const start =
          slot.startTime ||
          (slot.startMinute != null
            ? `${String(Math.floor(slot.startMinute / 60)).padStart(2, "0")}:${String(
                slot.startMinute % 60
              ).padStart(2, "0")}`
            : "09:00");

        const end =
          slot.endTime ||
          (slot.endMinute != null
            ? `${String(Math.floor(slot.endMinute / 60)).padStart(2, "0")}:${String(
                slot.endMinute % 60
              ).padStart(2, "0")}`
            : "10:00");

        return {
          id: slot.id,
          day: DAY_MAP[slot.dayOfWeek] || (typeof slot.day === "string" ? slot.day : "Monday"),
          startTime: start,
          endTime: end,
          subjectCode: subject?.code || (typeof slot.subjectCode === "string" ? slot.subjectCode : "GEN101"),
          subjectName: subject?.name || (typeof slot.subjectName === "string" ? slot.subjectName : "Course Lecture"),
          room: roomStr,
          instructor: teacher
            ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
            : typeof slot.instructor === "string"
            ? slot.instructor
            : "Faculty Assigned",
          type: (slot.type as "Lecture" | "Lab" | "Tutorial") || "Lecture",
        };
      });
    }

    return [];
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
    const items = Array.isArray(raw) ? raw : (raw as any)?.data || [];

    return items.map((e: any) => {
      const subject = e.subjectOffering?.subject || e.offering?.subject || e.subject;
      const roomStr =
        typeof e.room === "string"
          ? e.room
          : e.room?.code || e.room?.number || "Hall Assigned";

      const dateStr = e.scheduledAt || e.date;
      const parsedDate = dateStr ? new Date(dateStr) : new Date();

      return {
        id: e.id,
        subjectCode: subject?.code || (typeof e.subjectCode === "string" ? e.subjectCode : "Course"),
        subjectName: subject?.name || e.title || (typeof e.subjectName === "string" ? e.subjectName : "Course Exam"),
        examType: (e.type as "Mid-Term" | "End-Term" | "Practical") || "Mid-Term",
        date: dateStr ? parsedDate.toISOString().split("T")[0] : "",
        startTime: e.startTime || (dateStr ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00 AM"),
        endTime: e.endTime || "",
        room: roomStr,
        seatNumber: typeof e.seatNumber === "string" ? e.seatNumber : "Allocated at Gate",
        maxMarks: e.maxMarks || 100,
        syllabus: typeof e.syllabus === "string" ? e.syllabus : "Comprehensive course curriculum and assigned units.",
        status: (parsedDate > new Date() ? "UPCOMING" : "COMPLETED") as "UPCOMING" | "COMPLETED",
      };
    });
  },

  getResults: async (): Promise<SemesterResult> => {
    const raw = await apiClient<any>("/students/me/results");

    if (Array.isArray(raw)) {
      let totalCreditPoints = 0;
      let totalCredits = 0;

      const results: ResultItem[] = raw.map((r: any) => {
        const exam = r.exam;
        const subj = exam?.subjectOffering?.subject;
        const credits = subj?.credits ?? 3;
        const gradePoint = Number(r.gradePoints) || (r.passed ? 8 : 0);
        totalCreditPoints += gradePoint * credits;
        totalCredits += credits;

        return {
          subjectCode: subj?.code || "SUB101",
          subjectName: subj?.name || exam?.title || "Course Result",
          credits,
          internalMarks: 0,
          externalMarks: Number(r.marksObtained) || 0,
          totalMarks: Number(r.marksObtained) || 0,
          grade: r.grade || (r.passed ? "B" : "F"),
          gradePoint,
        };
      });

      const calculatedGpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 8.5;

      return {
        semester: raw[0]?.exam?.subjectOffering?.semester?.number || 6,
        sgpa: Number(calculatedGpa.toFixed(2)),
        cgpa: Number(calculatedGpa.toFixed(2)),
        academicYear: "2025-2026",
        results,
        aiInsights: {
          strongestSubject: results[0]?.subjectName || "Core Engineering",
          needsImprovementSubject: results[results.length - 1]?.subjectName || "Electives",
          summary: `You have completed ${results.length} academic courses with an average grade point of ${calculatedGpa.toFixed(2)}.`,
        },
      };
    }

    if (raw && typeof raw === "object") {
      return {
        semester: raw.semester ?? 6,
        sgpa: Number(raw.sgpa) || 0,
        cgpa: Number(raw.cgpa) || 0,
        academicYear: raw.academicYear || "2025-2026",
        results: Array.isArray(raw.results) ? raw.results : [],
        aiInsights: raw.aiInsights || {
          strongestSubject: "Core Engineering",
          needsImprovementSubject: "None",
          summary: "Academic performance record verified.",
        },
      };
    }

    return {
      semester: 6,
      sgpa: 0,
      cgpa: 0,
      academicYear: "2025-2026",
      results: [],
      aiInsights: {
        strongestSubject: "N/A",
        needsImprovementSubject: "N/A",
        summary: "No examination results published yet for this semester.",
      },
    };
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

    return items.map((s: any) => ({
      id: s.id,
      name: s.name || "Merit Scholarship",
      provider: s.provider || "State Government",
      category: s.type || s.category || "MERIT",
      amount: Number(s.amount) || 25000,
      deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "",
      criteria: s.eligibilityText || "Open to active college students in good academic standing.",
      requirements: Array.isArray(s.requirements)
        ? s.requirements
        : Array.isArray(s.requiredDocuments)
        ? s.requiredDocuments
        : ["Valid College ID", "Previous Semester Marksheet", "Income Certificate"],
      documentsNeeded: Array.isArray(s.documentsNeeded)
        ? s.documentsNeeded
        : Array.isArray(s.requiredDocuments)
        ? s.requiredDocuments
        : ["College ID Card", "Mark Sheet PDF", "Bank Passbook Copy"],
      status: s.status || "ELIGIBLE",
    }));
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

    return items.map((j: any) => ({
      id: j.id,
      company: j.company?.name || j.company || "Enterprise Partner",
      role: j.title || j.role || "Software Engineer",
      location: j.location || "Gurugram / Hybrid",
      ctc: j.ctc ? (typeof j.ctc === "number" || !isNaN(Number(j.ctc)) ? `${Number(j.ctc) / 100000} LPA` : String(j.ctc)) : "8.5 LPA",
      matchScore: j.matchScore ?? 92,
      deadline: j.deadline ? new Date(j.deadline).toISOString().split("T")[0] : "",
      eligibilityCriteria: {
        minCgpa: Number(j.minCgpa) || 7.0,
        backlogsAllowed: j.maxBacklogs ?? 0,
        eligibleBranches: Array.isArray(j.allowedDepartments) ? j.allowedDepartments : ["CSE", "IT", "ECE"],
      },
      requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : ["TypeScript", "React", "Node.js", "SQL"],
      status: j.status || "RECOMMENDED",
      rounds: Array.isArray(j.rounds)
        ? j.rounds
        : [
            { name: "Online Coding Assessment", date: "TBD", completed: false },
            { name: "Technical Interview", date: "TBD", completed: false },
            { name: "HR Discussion", date: "TBD", completed: false },
          ],
    }));
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

    return items.map((c: any) => ({
      id: c.id,
      ticketNumber: c.ticketNo || c.ticketNumber || `TKT-${c.id?.slice(0, 6) || "REQ"}`,
      category: c.category || "Infrastructure",
      subject: c.subject || c.title || "Campus Grievance",
      description: c.description || "",
      location: c.location || "Campus Premises",
      priority: c.priority || "MEDIUM",
      status: c.status || "OPEN",
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
      updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : "",
      assignedTo: c.assignedTo?.user ? `${c.assignedTo.user.firstName} ${c.assignedTo.user.lastName}` : "Campus Operations Committee",
      timeline: Array.isArray(c.timeline) && c.timeline.length > 0
        ? c.timeline
        : [
            {
              title: "Grievance Lodged",
              description: `Reported under category ${c.category || "General"} with ${c.priority || "MEDIUM"} priority.`,
              timestamp: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Logged",
            },
            ...(c.status !== "OPEN" && c.status !== "CREATED"
              ? [
                  {
                    title: `Status: ${c.status}`,
                    description: "Complaint processed and under official review by campus authority.",
                    timestamp: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "Updated",
                  },
                ]
              : []),
          ],
      studentFeedback:
        c.studentFeedback ||
        (c.feedbackRating
          ? {
              rating: c.feedbackRating,
              comment: c.feedbackComment || "Resolution accepted.",
            }
          : undefined),
    }));
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
    try {
      const raw = await apiClient<any>("/notifications");
      const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
      return items.map((n: any) => ({
        id: n.id,
        type: n.type || "general",
        title: n.title || "Notification",
        message: n.body || n.message || "",
        timestamp: n.createdAt
          ? new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
          : "Just now",
        isRead: !!n.readAt,
        actionUrl: n.data?.actionUrl,
      }));
    } catch {
      return [];
    }
  },
};
