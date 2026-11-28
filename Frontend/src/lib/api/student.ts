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
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  Sunday: "Sunday",
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
          const rawCode = (s as any).subjectCode || (s as any).code || "";
          const rawName = s.subjectName || "";
          const parts = rawName.split(" - ");

          let code = rawCode;
          let name = rawName;

          if (parts.length > 1) {
            if (!code || code === s.subjectId) {
              code = parts[0].trim();
            }
            name = parts.slice(1).join(" - ").trim();
          }

          // Strip raw database cuid or long random IDs from displaying as course code or name
          const isRawId = (val: string) =>
            !val || val === s.subjectId || val.length > 15 || /^[c][a-z0-9]{20,}$/i.test(val);

          if (isRawId(code)) {
            code = "";
          }
          if (isRawId(name)) {
            name = "Course Subject";
          }

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

  getAttendanceCalendar: async (params?: { month?: number; year?: number; subjectId?: string }) => {
    return apiClient<any>("/students/me/attendance/calendar", { params });
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
          ? `${a.subjectOffering.teacher.user.firstName || ""} ${a.subjectOffering.teacher.user.lastName || ""}`.trim()
          : a.offering?.teacher?.user
          ? `${a.offering.teacher.user.firstName || ""} ${a.offering.teacher.user.lastName || ""}`.trim()
          : a.teacherName || "Faculty Instructor",
        dueDate: a.dueAt ? new Date(a.dueAt).toISOString().split("T")[0] : a.dueDate || "",
        totalMarks: a.maxMarks ?? a.maxScore ?? a.totalMarks ?? 100,
        status: (a.submission?.status || a.submissions?.[0]?.status || (a.overdue ? "OVERDUE" : a.status) || "PENDING") as any,
        obtainedMarks: a.submission?.marks ?? a.submissions?.[0]?.score ?? a.obtainedMarks,
        feedback: a.submission?.feedback ?? a.submissions?.[0]?.feedback ?? a.feedback,
        attachments: Array.isArray(a.attachmentKeys) && a.attachmentKeys.length > 0
          ? a.attachmentKeys.map((key: string) => ({
              name: key.split("/").pop() || "Attachment",
              size: "",
              url: key,
            }))
          : a.attachments || [],
      }));
    }

    return Array.isArray(items) ? (items as Assignment[]) : [];
  },

  submitAssignment: async (assignmentId: string, fileData: { fileName?: string; size?: string; key?: string; text?: string }) => {
    const fileKeys = fileData.key ? [fileData.key] : [];
    const text = fileData.text?.trim() || (fileData.fileName ? `Submitted file: ${fileData.fileName}${fileData.size ? ` (${fileData.size})` : ""}` : undefined);
    return apiClient<{ success: boolean; message: string }>(
      `/assignments/${assignmentId}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          ...(fileKeys.length > 0 ? { fileKeys } : {}),
          ...(text ? { text } : {}),
        }),
      }
    );
  },

  getExams: async (): Promise<Exam[]> => {
    const raw = await apiClient<any[]>("/students/me/exams");
    const items = Array.isArray(raw) ? raw : (raw as any)?.data || [];
    const examTypeMap: Record<string, Exam["examType"]> = {
      MID_SEM: "Mid-Term",
      END_SEM: "End-Term",
      PRACTICAL: "Practical",
      INTERNAL: "Internal",
      VIVA: "Viva",
    };

    return items.map((e: any) => {
      const subject = e.subjectOffering?.subject || e.offering?.subject || e.subject;
      const roomStr =
        typeof e.room === "string"
          ? e.room
          : e.room?.code || e.room?.number || "Hall Assigned";

      const dateStr = e.scheduledAt || e.date;
      const parsedDate = dateStr ? new Date(dateStr) : new Date();
      const durationMs = (Number(e.durationMinutes) || 90) * 60 * 1000;
      const computedEnd = new Date(parsedDate.getTime() + durationMs).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: e.id,
        subjectCode: subject?.code || (typeof e.subjectCode === "string" ? e.subjectCode : "Course"),
        subjectName: subject?.name || e.title || (typeof e.subjectName === "string" ? e.subjectName : "Course Exam"),
        examType: examTypeMap[String(e.type || "").toUpperCase()] || (e.type as Exam["examType"]) || "Mid-Term",
        date: dateStr ? parsedDate.toISOString().split("T")[0] : "",
        startTime: e.startTime || (dateStr ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:00 AM"),
        endTime: e.endTime || (dateStr ? computedEnd : ""),
        room: roomStr,
        seatNumber: typeof e.seatNumber === "string" ? e.seatNumber : "Announced at Venue",
        maxMarks: e.maxMarks || 100,
        syllabus: typeof e.syllabus === "string" ? e.syllabus : (e.title ? `${e.title} syllabus` : "Course syllabus units"),
        status: (e.status || (parsedDate > new Date() ? "UPCOMING" : "COMPLETED")) as any,
      };
    });
  },

  getResults: async (): Promise<SemesterResult> => {
    const raw = await apiClient<any>("/students/me/results");

    if (Array.isArray(raw)) {
      const results: ResultItem[] = raw.map((r: any, idx: number) => {
        const exam = r.exam;
        const subj = exam?.subjectOffering?.subject;
        const sem = exam?.subjectOffering?.semester;
        const credits = subj?.credits ?? 3;
        const gradePoint = r.gradePoints !== undefined && r.gradePoints !== null ? Number(r.gradePoints) : (r.passed ? 8 : 0);

        return {
          id: r.id || `${subj?.code || "SUB"}-${exam?.id || idx}`,
          examId: exam?.id,
          examTitle: exam?.title || subj?.name || "Examination",
          examType: exam?.type || "END_SEM",
          semesterNumber: sem?.number ?? 1,
          academicYear: sem?.academicYear || "",
          subjectCode: subj?.code || "SUB101",
          subjectName: subj?.name || exam?.title || "Course Result",
          credits,
          internalMarks: 0,
          externalMarks: Number(r.marksObtained) || 0,
          totalMarks: Number(r.marksObtained) || 0,
          maxMarks: Number(exam?.maxMarks ?? 100),
          passed: Boolean(r.passed),
          grade: r.grade || (r.passed ? "P" : "F"),
          gradePoint,
        };
      });

      const gradedSource = results.some((r) => r.examType === "END_SEM")
        ? results.filter((r) => r.examType === "END_SEM")
        : results;
      const totalCredits = gradedSource.reduce((s, r) => s + (r.credits || 0), 0);
      const totalCreditPoints = gradedSource.reduce((s, r) => s + r.gradePoint * (r.credits || 0), 0);
      const calculatedGpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;

      const sortedByScore = [...results].sort(
        (a, b) => (b.totalMarks / Math.max(1, b.maxMarks || 100)) - (a.totalMarks / Math.max(1, a.maxMarks || 100)),
      );
      const primarySem = results[0]?.semesterNumber || 1;
      const primaryYear = results[0]?.academicYear || new Date().getFullYear().toString();

      return {
        semester: primarySem,
        sgpa: Number(calculatedGpa.toFixed(2)),
        cgpa: Number(calculatedGpa.toFixed(2)),
        academicYear: primaryYear,
        results,
        allResults: results,
        aiInsights: {
          strongestSubject: sortedByScore[0]?.subjectName || "Core Engineering",
          needsImprovementSubject: sortedByScore[sortedByScore.length - 1]?.subjectName || "Electives",
          summary: `You have ${results.length} published examination ${results.length === 1 ? "result" : "results"} with a credit-weighted average grade point of ${calculatedGpa.toFixed(2)}.`,
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
      const targetFee = items.find((f: any) => Number(f.outstanding ?? 0) > 0) || items[0];
      const totalAmount = items.reduce((sum: number, f: any) => sum + Number(f.netPayable ?? f.amountDue ?? f.amount ?? 0), 0);
      const paidAmount = items.reduce((sum: number, f: any) => sum + Number(f.amountPaid ?? f.paidAmount ?? 0), 0);
      const pendingAmount = items.reduce((sum: number, f: any) => sum + Number(f.outstanding ?? 0), 0);

      const feeHeads = items.map((f: any) => {
        const net = Number(f.netPayable ?? f.amountDue ?? f.amount ?? 0);
        const paid = Number(f.amountPaid ?? f.paidAmount ?? 0);
        const out = Number(f.outstanding ?? Math.max(0, net - paid));
        const comps = Array.isArray(f.feeStructure?.components) && f.feeStructure.components.length > 0
          ? f.feeStructure.components.map((c: any) => ({
              head: c.name || c.head || "Fee Component",
              amount: Number(c.amount || 0),
            }))
          : [{ head: f.feeStructure?.name || "Academic Fee", amount: net }];
        return {
          id: f.id,
          name: f.feeStructure?.name || "Academic Fee",
          academicYear: f.feeStructure?.academicYear || new Date().getFullYear().toString(),
          netPayable: net,
          paidAmount: paid,
          pendingAmount: out,
          dueDate: f.dueDate ? new Date(f.dueDate).toISOString().split("T")[0] : "",
          status: (f.computedStatus || f.status || (out <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING")) as any,
          components: comps,
        };
      });

      const breakdown = feeHeads.flatMap((head: any) =>
        feeHeads.length > 1
          ? head.components.map((c: any) => ({ head: `${head.name} — ${c.head}`, amount: c.amount }))
          : head.components
      );

      const allPayments = items.flatMap((f: any) => f.payments || []);
      const transactions = allPayments.map((p: any) => ({
        id: p.id,
        date: p.paidAt ? new Date(p.paidAt).toISOString().split("T")[0] : "",
        amount: Number(p.amount || 0),
        receiptNo: p.receiptNo || (p.status === 'SUCCESS' ? `RCP-${p.id.slice(0, 8)}` : null),
        gateway: p.gateway,
        method: p.gateway?.startsWith('manual:') ? p.gateway.replace('manual:', 'Cashier: ') : p.gateway === 'mock' ? 'Mock Gateway' : 'Online Gateway',
        status: p.status as "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED",
        refunds: p.refunds || [],
      }));

      return {
        id: targetFee.id,
        semester: targetFee.feeStructure?.semesterNumber ?? 1,
        academicYear: targetFee.feeStructure?.academicYear || new Date().getFullYear().toString(),
        totalAmount,
        paidAmount,
        pendingAmount,
        dueDate: targetFee.dueDate ? new Date(targetFee.dueDate).toISOString().split("T")[0] : "",
        status: (pendingAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING") as any,
        feeHeads,
        breakdown: breakdown.length > 0 ? breakdown : [{ head: targetFee.feeStructure?.name || "Semester Academic Fee", amount: totalAmount }],
        transactions,
      };
    }

    return {
      id: "fee_current",
      semester: 1,
      academicYear: new Date().getFullYear().toString(),
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      dueDate: "",
      status: "PAID",
      breakdown: [],
      transactions: [],
    };
  },

  getReceipt: async (paymentId: string) => {
    return apiClient<any>(`/fees/payments/${paymentId}/receipt`);
  },

  payFee: async (
    amount: number,
    studentFeeId?: string,
    gateway: string = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY || "mock"
  ) => {
    let feeId = studentFeeId;
    if (!feeId) {
      const currentFees = await apiClient<any>("/students/me/fees");
      const items = Array.isArray(currentFees) ? currentFees : currentFees?.items || currentFees?.data || [];
      const target = items.find((f: any) => Number(f.outstanding ?? 0) > 0) || items[0];
      if (!target?.id) {
        throw new Error("No payable student fee record found.");
      }
      feeId = target.id;
    }
    const res = await apiClient<{
      paymentId: string;
      gatewayRef: string;
      checkoutUrl?: string;
      clientPayload?: Record<string, unknown>;
    }>(
      `/fees/${feeId}/payments`,
      {
        method: "POST",
        body: JSON.stringify({
          gateway,
          amount,
        }),
      }
    );
    return { ...res, gateway };
  },

  getScholarships: async (): Promise<Scholarship[]> => {
    const [matchedRaw, mineRaw] = await Promise.all([
      apiClient<any>("/scholarships/matches").catch(() => apiClient<any>("/scholarships")),
      apiClient<any>("/scholarships/applications/mine").catch(() => []),
    ]);
    const items = Array.isArray(matchedRaw) ? matchedRaw : matchedRaw?.items || matchedRaw?.data || [];
    const mineList = Array.isArray(mineRaw) ? mineRaw : mineRaw?.items || mineRaw?.data || [];
    const appBySchId = new Map<string, any>(mineList.map((a: any) => [a.scholarshipId || a.scholarship?.id, a]));
    const seenIds = new Set<string>(items.map((entry: any) => (entry.scholarship || entry)?.id).filter(Boolean));
    const mergedItems = [
      ...items,
      ...mineList
        .filter((a: any) => a?.scholarship?.id && !seenIds.has(a.scholarship.id))
        .map((a: any) => ({ scholarship: a.scholarship, match: { fit: "ELIGIBLE", met: [], unmet: [], toVerify: [] } })),
    ];

    return mergedItems.map((item: any) => {
      const s = item.scholarship || item;
      const m = item.match || {};
      const app = appBySchId.get(s.id);
      const fit = m.fit || s.status || "POSSIBLE";
      const metCount = Array.isArray(m.met) ? m.met.length : 0;
      const unmetCount = Array.isArray(m.unmet) ? m.unmet.length : 0;
      const verifyCount = Array.isArray(m.toVerify) ? m.toVerify.length : 0;
      const totalChecks = metCount + unmetCount + verifyCount;
      const computedScore =
        typeof item.matchScore === "number"
          ? item.matchScore
          : totalChecks > 0
            ? Math.round((metCount / totalChecks) * 100)
            : fit === "ELIGIBLE"
              ? 100
              : fit === "POSSIBLE"
                ? 60
                : 0;

      const reasonParts: string[] = [];
      if (metCount) reasonParts.push(`Met: ${m.met.join(", ")}`);
      if (verifyCount) reasonParts.push(`Verify: ${m.toVerify.join(", ")}`);
      if (unmetCount) reasonParts.push(`Missing: ${m.unmet.join(", ")}`);

      return {
        id: s.id,
        name: s.name || s.title || "Scholarship",
        title: s.name || s.title || "Scholarship",
        provider: s.provider || "Institutional / Government",
        category: s.type || s.category || "GOVERNMENT",
        amount: s.amount !== null && s.amount !== undefined ? Number(s.amount) : 0,
        hasAmount: s.amount !== null && s.amount !== undefined,
        deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "",
        criteria: s.eligibilityText || (m.fit ? `Eligibility Fit: ${m.fit}` : "Verify criteria on official notice."),
        eligibilitySummary: s.eligibilityText || (m.fit ? `Eligibility Fit: ${m.fit}` : "Verify criteria on official notice."),
        matchScore: computedScore,
        aiReasoning: reasonParts.join(" • ") || s.eligibilityText || `Eligibility assessment: ${fit}`,
        matchDetails: {
          met: Array.isArray(m.met) ? m.met : [],
          unmet: Array.isArray(m.unmet) ? m.unmet : [],
          toVerify: Array.isArray(m.toVerify) ? m.toVerify : [],
        },
        requirements: Array.isArray(s.requirements)
          ? s.requirements
          : Array.isArray(s.requiredDocuments)
          ? s.requiredDocuments
          : [],
        documentsNeeded: Array.isArray(s.documentsNeeded)
          ? s.documentsNeeded
          : Array.isArray(s.requiredDocuments)
          ? s.requiredDocuments
          : [],
        status: app?.status || fit,
      } as any;
    });
  },

  expressScholarshipInterest: async (scholarshipId: string) => {
    return apiClient<any>(`/scholarships/${scholarshipId}/interest`, { method: "POST" });
  },

  applyScholarship: async (scholarshipId: string) => {
    return apiClient<{ success: boolean; message: string }>(
      `/scholarships/${scholarshipId}/apply`,
      { method: "POST" }
    );
  },

  getPlacements: async (): Promise<PlacementOpportunity[]> => {
    const [recRaw, mineRaw] = await Promise.all([
      apiClient<any>("/placements/jobs/recommendations").catch(() => apiClient<any>("/placements/jobs")),
      apiClient<any>("/placements/applications/mine").catch(() => []),
    ]);
    const items = Array.isArray(recRaw) ? recRaw : recRaw?.items || recRaw?.data || [];
    const mineList = Array.isArray(mineRaw) ? mineRaw : mineRaw?.items || mineRaw?.data || [];
    const appByJobId = new Map<string, any>(mineList.map((a: any) => [a.jobId || a.job?.id, a]));

    return items.map((entry: any) => {
      const j = entry.job || entry;
      const match = entry.match || {};
      const app = appByJobId.get(j.id);
      const numericCtc = j.ctc !== undefined && j.ctc !== null && !isNaN(Number(j.ctc)) ? Number(j.ctc) : null;
      const ctcLabel = numericCtc !== null
        ? numericCtc >= 100000
          ? `${(numericCtc / 100000).toFixed(1)} LPA`
          : `₹${numericCtc.toLocaleString("en-IN")}`
        : j.ctc ? String(j.ctc) : "As per norms";

      return {
        id: j.id,
        company: j.company?.name || j.company || "Hiring Partner",
        role: j.title || j.role || "Role",
        location: j.location || "Campus / Remote",
        ctc: ctcLabel,
        matchScore: typeof match.score === "number" ? match.score : (typeof j.matchScore === "number" ? j.matchScore : 0),
        eligible: match.eligible !== undefined ? match.eligible : true,
        matchedSkills: Array.isArray(match.matchedSkills) ? match.matchedSkills : [],
        missingSkills: Array.isArray(match.missingSkills) ? match.missingSkills : [],
        ineligibleReasons: Array.isArray(match.ineligibleReasons) ? match.ineligibleReasons : [],
        applicationId: app?.id,
        applicationStatus: app?.status,
        offers: app?.offers || [],
        interviews: Array.isArray(app?.interviews) ? app.interviews : [],
        deadline: j.deadline ? new Date(j.deadline).toISOString().split("T")[0] : "",
        eligibilityCriteria: {
          minCgpa: j.minCgpa !== undefined && j.minCgpa !== null ? Number(j.minCgpa) : 0,
          backlogsAllowed: j.maxBacklogs ?? 0,
          eligibleBranches: Array.isArray(j.allowedDepartments) && j.allowedDepartments.length > 0 ? j.allowedDepartments : ["All Departments"],
        },
        requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
        status: app?.status || (match.eligible === false ? "NOT_ELIGIBLE" : j.status || "OPEN"),
        rounds: Array.isArray(app?.interviews) && app.interviews.length > 0
          ? app.interviews.map((iv: any) => ({
              round: iv.round ?? 1,
              title: `Round ${iv.round ?? 1} (${iv.mode || "INTERVIEW"})`,
              date: iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : "Scheduled",
              status: iv.status || "SCHEDULED",
            }))
          : Array.isArray(j.rounds)
            ? j.rounds
            : [],
      } as any;
    });
  },

  applyPlacement: async (placementId: string) => {
    return apiClient<{ success: boolean; message: string }>(
      `/placements/jobs/${placementId}/apply`,
      { method: "POST" }
    );
  },

  respondPlacementOffer: async (offerId: string, decision: "ACCEPT" | "DECLINE") => {
    return apiClient<{ status: string }>(
      `/placements/offers/${offerId}/respond`,
      { method: "POST", body: JSON.stringify({ decision }) }
    );
  },

  withdrawPlacement: async (applicationId: string) => {
    return apiClient<{ status: string }>(
      `/placements/applications/${applicationId}/withdraw`,
      { method: "POST" }
    );
  },

  getComplaints: async (): Promise<Complaint[]> => {
    const raw = await apiClient<any>("/complaints/my");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];

    return items.map((c: any) => {
      const assignedPerson = c.assignedTo?.firstName
        ? `${c.assignedTo.firstName} ${c.assignedTo.lastName || ""}`.trim()
        : c.assignedTo?.user?.firstName
        ? `${c.assignedTo.user.firstName} ${c.assignedTo.user.lastName || ""}`.trim()
        : c.assignedDepartment?.name
        ? `${c.assignedDepartment.name} Desk`
        : "Campus Operations Committee";

      const mappedEvents =
        Array.isArray(c.events) && c.events.length > 0
          ? c.events.map((ev: any) => ({
              title: String(ev.type || "UPDATE").replace(/_/g, " "),
              description: ev.note || `Updated to ${ev.type || "progress"}.`,
              timestamp: ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "Recorded",
            }))
          : null;

      return {
        id: c.id,
        ticketNumber: c.ticketNo || c.ticketNumber || `TKT-${c.id?.slice(0, 6) || "REQ"}`,
        category: c.category || "Infrastructure",
        subject: c.subject || c.title || "Campus Grievance",
        description: c.description || "",
        location: c.location || "",
        priority: c.priority || "MEDIUM",
        status: c.status || "OPEN",
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
        updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : "",
        assignedTo: assignedPerson,
        timeline: mappedEvents
          ? mappedEvents
          : Array.isArray(c.timeline) && c.timeline.length > 0
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
      };
    });
  },

  createComplaint: async (data: {
    category: Complaint["category"] | "ATTENDANCE" | "Attendance" | string;
    subject: string;
    description: string;
    priority?: string;
  }) => {
    let cat = (data.category || "").toUpperCase();
    if (cat === "FEE" || cat === "FINANCE") cat = "FEES";
    else if (cat === "FACILITY" || cat === "INFRASTRUCTURE") cat = "INFRASTRUCTURE";
    else if (cat === "RAGGING/HARASSMENT" || cat === "HARASSMENT" || cat === "DISCIPLINE") cat = "OTHER";
    else if (!["ACADEMIC", "FACULTY", "INFRASTRUCTURE", "HOSTEL", "TRANSPORT", "IT", "FEES", "SCHOLARSHIP", "EXAMINATION", "ATTENDANCE", "OTHER"].includes(cat)) {
      cat = "OTHER";
    }

    let pri = (data.priority || "MEDIUM").toUpperCase();
    if (pri === "URGENT") pri = "CRITICAL";
    if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(pri)) pri = "MEDIUM";

    return apiClient<Complaint>(
      "/complaints",
      {
        method: "POST",
        body: JSON.stringify({
          subject: data.subject,
          description: data.description,
          category: cat,
          priority: pri,
        }),
      }
    );
  },

  getNotices: async (): Promise<Notice[]> => {
    const raw = await apiClient<any>("/notices");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items.map((n: any) => ({
      id: n.id,
      title: n.title || "Official Notice",
      content: n.body || n.content || "",
      date: (n.publishedAt || n.createdAt)
        ? new Date(n.publishedAt || n.createdAt).toISOString().split("T")[0]
        : "",
      department: n.department?.code || n.department?.name || n.department || "All Departments",
      priority: n.priority || (n.isPinned ? "HIGH" : "NORMAL"),
      attachments: Array.isArray(n.attachmentKeys)
        ? n.attachmentKeys.map((key: string) => ({
            name: key.split("/").pop() || "Attachment",
            size: "File",
            url: `/api/v1/files/download?key=${encodeURIComponent(key)}`,
          }))
        : n.attachments || [],
    })) as Notice[];
  },

  getDocuments: async (): Promise<CollegeDocument[]> => {
    const raw = await apiClient<any>("/documents");
    const items = Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
    return items.map((doc: any) => ({
      id: doc.id,
      title: doc.title || "Institutional Document",
      category:
        doc.category ||
        (typeof doc.documentType === "string" && doc.documentType
          ? doc.documentType.charAt(0).toUpperCase() + doc.documentType.slice(1).toLowerCase()
          : "Policy"),
      department: typeof doc.department === "string" ? doc.department : doc.department?.code || doc.department?.name || "Academic Affairs",
      academicYear: doc.academicYear || "",
      uploadedAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Recent",
      fileSize: doc.sizeBytes ? `${(doc.sizeBytes / 1024).toFixed(1)} KB` : (doc.fileSize || "PDF"),
      fileType: doc.mimeType || doc.fileType || "application/pdf",
      url: doc.url || `/api/v1/documents/${doc.id}/download`,
      summary: doc.summary || doc.description || `Official institutional document for ${doc.title || "academic records"}.`,
    })) as CollegeDocument[];
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
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
      data: n.data && typeof n.data === "object" ? n.data : undefined,
    }));
  },

  requestAttendanceCorrection: async (data: {
    attendanceId: string;
    newStatus: "PRESENT" | "ABSENT" | "LATE";
    reason: string;
  }) => {
    return apiClient<{ success: boolean; message: string }>(
      "/attendance/correction-request",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },
};