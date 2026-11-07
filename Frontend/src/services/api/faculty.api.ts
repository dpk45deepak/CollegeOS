import { apiClient } from "@/lib/api/client";

export interface TeacherProfile {
  id: string;
  employeeId: string;
  designation?: string | null;
  qualifications?: string | null;
  departmentId: string;
  department?: { id: string; code: string; name: string };
  user: {
    id: string;
    loginId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  offerings?: SubjectOffering[];
}

export interface SubjectOffering {
  id: string;
  subjectId: string;
  semesterId: string;
  sectionId: string;
  teacherId: string;
  subject?: { id: string; code: string; name: string; credits?: number };
  section?: { id: string; name: string };
  semester?: { id: string; number: number; academicYear: string };
  teacher?: { id: string; user?: { firstName: string; lastName: string } };
  defaultRoom?: { id: string; code: string; number?: string } | string;
  _count?: { enrollments: number };
}

export interface StudentRosterItem {
  id: string;
  studentId: string;
  subjectOfferingId: string;
  student: {
    id: string;
    rollNumber: string;
    user: {
      firstName: string;
      lastName: string;
      loginId: string;
      email: string;
    };
  };
}

export interface CreateTeacherDto {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId: string;
  designation?: string;
  qualifications?: string;
  isHod?: boolean;
  initialPassword?: string;
}

export interface CreateOfferingDto {
  subjectId: string;
  semesterId: string;
  sectionId: string;
  teacherId: string;
  enrollSection?: boolean;
}

export interface LeaveRequestDto {
  fromDate: string;
  toDate: string;
  reason: string;
}

export const facultyApi = {
  getMe: async (): Promise<TeacherProfile> => {
    return apiClient<TeacherProfile>("/teachers/me");
  },

  list: async (params?: { departmentId?: string; page?: number; limit?: number }): Promise<{ items: TeacherProfile[]; total: number; page: number; limit: number } | TeacherProfile[]> => {
    return apiClient<any>("/teachers", { params });
  },

  create: async (dto: CreateTeacherDto): Promise<TeacherProfile> => {
    return apiClient<TeacherProfile>("/teachers", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  // Offerings & Rosters
  listOfferings: async (params?: { sectionId?: string; page?: number; limit?: number }): Promise<SubjectOffering[]> => {
    const raw = await apiClient<any>("/subject-offerings", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createOffering: async (dto: CreateOfferingDto): Promise<SubjectOffering> => {
    return apiClient<SubjectOffering>("/subject-offerings", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  enrollStudents: async (offeringId: string, studentIds: string[]) => {
    return apiClient<any>(`/subject-offerings/${offeringId}/enrollments`, {
      method: "POST",
      body: JSON.stringify({ studentIds }),
    });
  },

  getRoster: async (offeringId: string): Promise<StudentRosterItem[]> => {
    const raw = await apiClient<any>(`/subject-offerings/${offeringId}/students`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  // Leave Management
  requestLeave: async (dto: LeaveRequestDto) => {
    return apiClient<any>("/leave-requests", {
      method: "POST",
      body: JSON.stringify(dto),
    });
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

