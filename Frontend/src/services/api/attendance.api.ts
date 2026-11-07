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
  studentId: string;
  requestedStatus: "PRESENT" | "ABSENT" | "LATE";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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

export const attendanceApi = {
  mark: async (dto: {
    subjectOfferingId: string;
    date: string;
    records: Array<{ studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }>;
  }) => {
    return apiClient<{ success: boolean; count: number }>("/attendance", {
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
    attendanceId: string;
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

  getShortageAnalytics: async (params?: { page?: number; limit?: number }): Promise<AttendanceShortageItem[]> => {
    const raw = await apiClient<any>("/attendance/analytics/shortage", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getAnomalies: async () => {
    return apiClient<any>("/attendance/analytics/anomalies");
  },
};

