import { apiClient } from "@/lib/api/client";

export interface Guardian {
  name: string;
  relation: string;
  phone?: string;
  email?: string;
}

export interface StudentSkill {
  id: string;
  name: string;
  level?: number;
}

export type StudentGender = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";
export type PortfolioItemType = "CERTIFICATION" | "PROJECT" | "ACHIEVEMENT";

export interface StudentPortfolioItem {
  id: string;
  type: PortfolioItemType;
  title: string;
  description?: string;
  url?: string;
  issuedAt?: string;
  tags?: string[];
}

export interface StudentProfile {
  id: string;
  collegeStudentId: string;
  rollNumber: string;
  user: {
    id: string;
    loginId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  department: { id: string; code: string; name: string };
  program: { id: string; code: string; name: string };
  batch: { id: string; name: string; startYear: number; endYear: number };
  section?: { id: string; name: string };
  semester?: { id: string; number: number; academicYear: string };
  dateOfBirth?: string;
  gender?: StudentGender;
  cgpa?: number | string | null;
  address?: Record<string, string>;
  guardians?: Guardian[];
  skills?: StudentSkill[];
  portfolio?: StudentPortfolioItem[];
}

export interface CreateStudentDto {
  collegeStudentId: string;
  rollNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId: string;
  programId: string;
  batchId: string;
  sectionId?: string;
  semesterId?: string;
  dateOfBirth?: string;
  gender?: StudentGender;
  address?: Record<string, string>;
  guardians?: Guardian[];
  initialPassword?: string;
}

export interface UpdateStudentDto {
  rollNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
  sectionId?: string;
  semesterId?: string;
  dateOfBirth?: string;
  gender?: StudentGender;
  address?: Record<string, string>;
}

export interface StudentListQuery {
  [key: string]: string | number | boolean | null | undefined;
  departmentId?: string;
  programId?: string;
  batchId?: string;
  sectionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const studentsApi = {
  // Current Student (Self)
  getMe: async (): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/students/me");
  },

  updateMe: async (dto: { phone?: string; address?: Record<string, string> }): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/students/me", {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  addSkill: async (dto: { name: string; level?: number }): Promise<StudentSkill> => {
    return apiClient<StudentSkill>("/students/me/skills", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  removeSkill: async (name: string): Promise<void> => {
    return apiClient<void>(`/students/me/skills/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },

  addPortfolioItem: async (dto: {
    type: PortfolioItemType;
    title: string;
    description?: string;
    url?: string;
    issuedAt?: string;
    tags?: string[];
  }): Promise<StudentPortfolioItem> => {
    return apiClient<StudentPortfolioItem>("/students/me/portfolio", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  removePortfolioItem: async (id: string): Promise<void> => {
    return apiClient<void>(`/students/me/portfolio/${id}`, {
      method: "DELETE",
    });
  },

  // Admin / Faculty Student Management
  list: async (params?: StudentListQuery): Promise<{ items: StudentProfile[]; total: number; page: number; limit: number } | StudentProfile[]> => {
    return apiClient<any>("/students", { params });
  },

  create: async (dto: CreateStudentDto): Promise<StudentProfile> => {
    return apiClient<StudentProfile>("/students", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getById: async (id: string): Promise<StudentProfile> => {
    return apiClient<StudentProfile>(`/students/${id}`);
  },

  update: async (id: string, dto: UpdateStudentDto): Promise<StudentProfile> => {
    return apiClient<StudentProfile>(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  // Student Portal Aggregations
  getDashboard: async (wardStudentId?: string) => {
    return apiClient<any>("/students/me/dashboard", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },

  getAttendanceReport: async (wardStudentId?: string) => {
    return apiClient<any>("/students/me/attendance", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },

  getAttendanceRecords: async (params?: { studentId?: string; subjectId?: string; from?: string; to?: string }) => {
    return apiClient<any>("/students/me/attendance/records", { params });
  },

  getTimetable: async (wardStudentId?: string) => {
    return apiClient<any[]>("/students/me/timetable", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },

  getAssignments: async (params?: { studentId?: string; subjectOfferingId?: string; pending?: string }) => {
    return apiClient<any>("/students/me/assignments", { params });
  },

  getExams: async (wardStudentId?: string) => {
    return apiClient<any[]>("/students/me/exams", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },

  getResults: async (wardStudentId?: string) => {
    return apiClient<any>("/students/me/results", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },

  getFees: async (wardStudentId?: string) => {
    return apiClient<any>("/students/me/fees", {
      params: wardStudentId ? { studentId: wardStudentId } : undefined,
    });
  },
};
