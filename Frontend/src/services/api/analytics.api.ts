import { apiClient } from "@/lib/api/client";

export interface AnalyticsOverview {
  students: number;
  attendancePercentage: number;
  attendanceThreshold: number;
  studentsBelowThreshold: number;
  passPercentage: number;
  averageCgpa: number;
  assignmentCompletionRate: number;
  feeCollection: {
    collected: number;
    outstanding: number;
    collectionRate: number;
  };
  placementRate: number;
  complaints: {
    total: number;
    resolved: number;
    avgResolutionHours: number;
  };
  scholarshipParticipation: number;
}

export interface AttentionItem {
  key: string;
  count: number;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  action?: string;
}

export interface DepartmentMetric {
  department: string;
  departmentCode: string;
  students: number;
  attendancePct: number;
  passPct: number;
  teachers: number;
}

export interface AttendanceTrendItem {
  date: string;
  percentage: number;
}

export interface RiskStudentItem {
  studentId: string;
  rollNumber: string;
  name: string;
  department: string;
  level: "ELEVATED" | "CRITICAL";
  reasons: string[];
  attendancePct: number;
  cgpa: number;
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
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },
};

