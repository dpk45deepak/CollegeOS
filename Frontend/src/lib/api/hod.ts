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
    const [raw, teachersRes, hodDept] = await Promise.all([
      apiClient<any>("/analytics/overview"),
      apiClient<any>("/teachers").catch(() => null),
      apiClient<any>("/analytics/hod/department").catch(() => null),
    ]);

    const totalFaculty =
      hodDept?.facultyCount ??
      teachersRes?.total ??
      (Array.isArray(teachersRes) ? teachersRes.length : 0);

    return {
      department: hodDept?.departments?.[0]?.name || "Department Overview",
      totalStudents: hodDept?.overview?.students ?? raw?.students ?? 0,
      totalFaculty,
      avgAttendance: hodDept?.overview?.attendancePercentage ?? raw?.attendancePercentage ?? 0,
      studentsBelow75: hodDept?.overview?.studentsBelowThreshold ?? raw?.studentsBelowThreshold ?? 0,
      facultyWorkloadHours: (hodDept?.facultyWorkloadHours || []).map((fw: any) => ({
        facultyName: fw.name,
        hoursPerWeek: fw.weeklyHours ?? 0,
        subjects: [`${fw.offeringsCount} offering(s)`],
      })),
      subjectPassRates: (hodDept?.subjectPassRates || []).map((sp: any) => ({
        subject: `${sp.subjectCode} — ${sp.subjectName}`,
        passRate: sp.passPercentage ?? 0,
        avgScore: sp.avgScorePct ?? 0,
      })),
    };
  },

  getAttendanceCorrections: async (status?: string) => {
    const raw = await apiClient<any>("/attendance/corrections", {
      params: status ? { status } : undefined,
    });
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

  getLeaveRequests: async (status?: string) => {
    const raw = await apiClient<any>("/leave-requests", {
      params: status ? { status } : undefined,
    });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  approveLeave: async (id: string) => {
    return apiClient<any>(`/leave-requests/${id}/approve`, {
      method: "POST",
    });
  },

  rejectLeave: async (id: string) => {
    return apiClient<any>(`/leave-requests/${id}/reject`, {
      method: "POST",
    });
  },
};