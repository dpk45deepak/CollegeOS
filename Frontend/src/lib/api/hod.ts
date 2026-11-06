import { apiClient } from "./client";

export interface DepartmentMetrics {
  department: string;
  totalStudents: number;
  totalFaculty: number;
  avgAttendance: number;
  studentsBelow75: number;
  facultyWorkloadHours: {
    facultyName: string;
    hoursPerWeek: number;
    subjects: string[];
  }[];
  subjectPassRates: {
    subject: string;
    passRate: number;
    avgScore: number;
  }[];
}

export const hodApi = {
  getDepartmentMetrics: async (): Promise<DepartmentMetrics> => {
    const [raw, teachersRes] = await Promise.all([
      apiClient<any>("/analytics/overview"),
      apiClient<any>("/teachers").catch(() => null),
    ]);

    const totalFaculty = teachersRes?.total ?? (Array.isArray(teachersRes) ? teachersRes.length : 0);

    return {
      department: "Department Overview",
      totalStudents: raw?.students ?? 0,
      totalFaculty,
      avgAttendance: raw?.attendancePercentage ?? 0,
      studentsBelow75: raw?.studentsBelowThreshold ?? 0,
      facultyWorkloadHours: [],
      subjectPassRates: [],
    };
  },

  getAttendanceCorrections: async () => {
    const raw = await apiClient<any>("/attendance/corrections");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  reviewAttendanceCorrection: async (
    id: string,
    data: { approve: boolean; note?: string }
  ) => {
    return apiClient<any>(`/attendance/corrections/${id}/review`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  approveLeave: async (id: string) => {
    return apiClient<any>(`/teachers/leave-requests/${id}/approve`, {
      method: "POST",
    });
  },

  rejectLeave: async (id: string) => {
    return apiClient<any>(`/teachers/leave-requests/${id}/reject`, {
      method: "POST",
    });
  },
};