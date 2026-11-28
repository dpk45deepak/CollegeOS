import { apiClient, apiClientWithMeta } from "./client";

export interface HodDepartmentAnalytics {
  departments: Array<{ id: string; code: string; name: string }>;
  facultyCount: number;
  subjectCount: number;
  pendingCorrectionsCount: number;
  pendingLeaveRequestsCount: number;
  overview: {
    students: number;
    attendancePercentage: number | null;
    attendanceThreshold: number;
    studentsBelowThreshold: number;
    passPercentage: number | null;
    averageCgpa: number | null;
    assignmentCompletionPercentage: number | null;
    complaints: { total: number; resolved: number; avgResolutionHours: number | null };
  };
  facultyWorkloadHours: Array<{
    teacherId: string;
    employeeId: string;
    name: string;
    departmentCode: string;
    offeringsCount: number;
    weeklyHours: number;
    sessionsLast30Days: number;
  }>;
  subjectPassRates: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    studentsEvaluated: number;
    passedCount: number;
    passPercentage: number | null;
    avgScorePct: number | null;
  }>;
}

export interface ExecutiveAnalytics {
  generatedAt: string;
  scope: "college" | "department";
  overview: HodDepartmentAnalytics["overview"] & {
    feeCollection: {
      totalDue: number;
      collected: number;
      outstanding: number;
      collectionRatePct: number | null;
    };
    placementRatePct: number | null;
    studentsPlaced: number;
    scholarshipParticipationPct: number | null;
  };
  departmentComparison: Array<{
    department: string;
    students: number;
    attendancePct: number | null;
    avgCgpa: number | null;
  }>;
  enrollmentTrend: Array<{ label: string; startYear: number; students: number }>;
  cgpaDistribution: Array<{ range: string; count: number }>;
  placementStats: {
    totalJobs: number;
    openJobs: number;
    drivesCount: number;
    applicationsCount: number;
    offersIssued: number;
    offersAccepted: number;
    averageCtc: number | null;
    placementRatePct: number | null;
  };
  insights: Array<{
    id: string;
    title: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
    metricValue: string;
    summary: string;
    dataUsed: string;
    period: string;
    basis: "DETERMINISTIC";
    recommendedAction: string;
  }>;
}

export interface GuardianWardSummary {
  id: string;
  rollNumber: string;
  collegeStudentId: string;
  cgpa?: number | null;
  user: { firstName: string; lastName: string; email: string };
  department?: { id: string; code: string; name: string };
  program?: { id: string; code: string; name: string };
  section?: { id: string; name: string };
  semester?: { id: string; number: number; academicYear: string };
}

export const specialistApi = {
  // HOD & Executive Analytics
  getHodDepartmentAnalytics: (departmentId?: string) =>
    apiClient<HodDepartmentAnalytics>("/analytics/hod/department", {
      params: departmentId ? { departmentId } : undefined,
    }),

  getExecutiveAnalytics: (departmentId?: string) =>
    apiClient<ExecutiveAnalytics>("/analytics/executive", {
      params: departmentId ? { departmentId } : undefined,
    }),

  // Timetable updates
  updateTimetableSlot: (
    slotId: string,
    payload: {
      roomId?: string;
      dayOfWeek?: string;
      startMinute?: number;
      endMinute?: number;
      validFrom?: string;
      validTo?: string;
      teacherId?: string;
    },
  ) =>
    apiClient<{ slot: any; warnings: string[] }>(`/timetable/slots/${slotId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // Fees: Mock interactive completion + Ledger + Refunds
  completeMockPayment: (paymentId: string, succeed = true) =>
    apiClient<{ payment: any; receiptNo?: string }>(`/fees/payments/${paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ succeed }),
    }),

  listAllFees: async (params?: { status?: string; studentId?: string; page?: number; limit?: number }) => {
    const res = await apiClientWithMeta<any[]>("/fees", { params });
    const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items ?? [];
    return { items, meta: res.meta };
  },

  listFeeRefunds: async (params?: { studentId?: string; page?: number; limit?: number }) => {
    const res = await apiClientWithMeta<any[]>("/fees/refunds", { params });
    const items = Array.isArray(res.data) ? res.data : (res.data as any)?.items ?? [];
    return { items, meta: res.meta };
  },

  // Placements: TPO & Student offer response
  listJobApplications: (jobId: string) =>
    apiClient<any[]>(`/placements/jobs/${jobId}/applications`),

  updateJobApplicationStatus: (applicationId: string, status: string) =>
    apiClient<any>(`/placements/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  scheduleJobInterview: (applicationId: string, dto: { scheduledAt: string; mode: string; round?: number }) =>
    apiClient<any>(`/placements/applications/${applicationId}/interviews`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  issueJobOffer: (applicationId: string, ctc: number) =>
    apiClient<any>(`/placements/applications/${applicationId}/offers`, {
      method: "POST",
      body: JSON.stringify({ ctc }),
    }),

  respondToOffer: (offerId: string, decision: "ACCEPT" | "DECLINE") =>
    apiClient<any>(`/placements/offers/${offerId}/respond`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),

  withdrawJobApplication: (applicationId: string) =>
    apiClient<any>(`/placements/applications/${applicationId}/withdraw`, {
      method: "POST",
    }),

  // Scholarships admin applications
  listScholarshipApplications: (scholarshipId: string) =>
    apiClient<any[]>(`/scholarships/${scholarshipId}/applications`),

  // Parent Ward endpoints
  getParentWards: async (): Promise<GuardianWardSummary[]> => {
    const raw = await apiClient<any>("/students", { params: { limit: 20 } });
    return Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? [];
  },
};
