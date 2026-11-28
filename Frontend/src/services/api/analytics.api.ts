import { apiClient } from "@/lib/api/client";

export interface AnalyticsOverview {
  students: number;
  attendancePercentage: number;
  attendanceThreshold: number;
  studentsBelowThreshold: number;
  passPercentage: number;
  averageCgpa: number;
  assignmentCompletionPercentage: number;
  feeCollection: {
    collected: number;
    outstanding: number;
    totalDue?: number;
    collectionRatePct: number;
  };
  placementRatePct: number;
  studentsPlaced?: number;
  complaints: {
    total: number;
    resolved: number;
    avgResolutionHours: number;
  };
  scholarshipParticipationPct: number;
}

export interface AttentionItem {
  key: string;
  count: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
  message: string;
  action?: string;
}

export interface DepartmentMetric {
  department: string;
  students: number;
  attendancePct: number;
  avgCgpa?: number;
}

export interface AttendanceTrendItem {
  date: string;
  pct: number;
}

export interface RiskStudentItem {
  studentId: string;
  level: "LOW" | "MEDIUM" | "HIGH";
  score: number;
  reasons: string[];
  computedAt: string;
  student?: {
    id: string;
    rollNumber: string;
    user?: { firstName: string; lastName: string };
    department?: { code: string };
  };
}

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    return apiClient<AnalyticsOverview>("/analytics/overview");
  },

  getAttention: async (): Promise<AttentionItem[]> => {
    const raw = await apiClient<any>("/analytics/attention");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAttendanceTrend: async (): Promise<AttendanceTrendItem[]> => {
    const raw = await apiClient<any>("/analytics/attendance-trend");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getDepartmentBreakdown: async (): Promise<DepartmentMetric[]> => {
    const raw = await apiClient<any>("/analytics/departments");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAttendanceVsPerformance: async () => {
    return apiClient<any>("/analytics/attendance-vs-performance");
  },

  getAtRiskStudents: async (): Promise<RiskStudentItem[]> => {
    const raw = await apiClient<any>("/analytics/risk");
    return Array.isArray(raw) ? raw : raw?.students || raw?.items || raw?.data || [];
  },
};

