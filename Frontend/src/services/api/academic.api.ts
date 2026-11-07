import { apiClient } from "@/lib/api/client";

export interface Department {
  id: string;
  code: string;
  name: string;
  campusId?: string | null;
  hodUserId?: string | null;
  _count?: { students?: number; teachers?: number };
}

export interface Program {
  id: string;
  code: string;
  name: string;
  durationSemesters: number;
}

export interface Batch {
  id: string;
  name: string;
  programId: string;
  departmentId: string;
  startYear: number;
  endYear: number;
  program?: Program;
  department?: Department;
}

export interface Semester {
  id: string;
  batchId: string;
  number: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  batch?: Batch;
}

export interface Section {
  id: string;
  semesterId: string;
  name: string;
  capacity?: number;
  semester?: Semester;
  _count?: { students?: number };
}

export interface Subject {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  credits: number;
  semesterNumber?: number;
  isElective: boolean;
  department?: Department;
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  address?: string;
}

export interface CollegeSettings {
  id: string;
  code: string;
  name: string;
  attendanceMode: "PER_LECTURE" | "DAILY" | "CUSTOM";
  attendanceThreshold: number;
  timezone: string;
}

export const academicApi = {
  // College & Settings
  getCurrentCollege: async (): Promise<CollegeSettings> => {
    return apiClient<CollegeSettings>("/colleges/current");
  },

  updateSettings: async (dto: Partial<CollegeSettings>): Promise<CollegeSettings> => {
    return apiClient<CollegeSettings>("/colleges/current/settings", {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  // Campuses
  listCampuses: async (): Promise<Campus[]> => {
    const raw = await apiClient<any>("/campuses");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createCampus: async (dto: { code: string; name: string; address?: string }): Promise<Campus> => {
    return apiClient<Campus>("/campuses", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateCampus: async (id: string, dto: Partial<{ code: string; name: string; address?: string }>): Promise<Campus> => {
    return apiClient<Campus>(`/campuses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  // Departments
  listDepartments: async (): Promise<Department[]> => {
    const raw = await apiClient<any>("/departments");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createDepartment: async (dto: { code: string; name: string; campusId?: string; hodUserId?: string }): Promise<Department> => {
    return apiClient<Department>("/departments", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateDepartment: async (id: string, dto: Partial<{ code: string; name: string; campusId?: string; hodUserId?: string }>): Promise<Department> => {
    return apiClient<Department>(`/departments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  // Programs
  listPrograms: async (): Promise<Program[]> => {
    const raw = await apiClient<any>("/programs");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createProgram: async (dto: { code: string; name: string; durationSemesters: number }): Promise<Program> => {
    return apiClient<Program>("/programs", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateProgram: async (id: string, dto: Partial<{ code: string; name: string; durationSemesters: number }>): Promise<Program> => {
    return apiClient<Program>(`/programs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  // Batches
  listBatches: async (params?: { departmentId?: string; programId?: string }): Promise<Batch[]> => {
    const raw = await apiClient<any>("/batches", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createBatch: async (dto: { programId: string; departmentId: string; startYear: number; endYear: number; name: string }): Promise<Batch> => {
    return apiClient<Batch>("/batches", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  // Semesters
  listSemesters: async (batchId?: string): Promise<Semester[]> => {
    const raw = await apiClient<any>("/semesters", { params: batchId ? { batchId } : undefined });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createSemester: async (dto: { batchId: string; number: number; academicYear: string; startDate: string; endDate: string; isCurrent?: boolean }): Promise<Semester> => {
    return apiClient<Semester>("/semesters", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  // Sections
  listSections: async (semesterId?: string): Promise<Section[]> => {
    const raw = await apiClient<any>("/sections", { params: semesterId ? { semesterId } : undefined });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createSection: async (dto: { semesterId: string; name: string; capacity?: number }): Promise<Section> => {
    return apiClient<Section>("/sections", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  // Subjects
  listSubjects: async (params?: { departmentId?: string; search?: string; page?: number; limit?: number }): Promise<Subject[]> => {
    const raw = await apiClient<any>("/subjects", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createSubject: async (dto: { departmentId: string; code: string; name: string; credits?: number; semesterNumber?: number; isElective?: boolean }): Promise<Subject> => {
    return apiClient<Subject>("/subjects", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  updateSubject: async (id: string, dto: Partial<{ departmentId: string; code: string; name: string; credits?: number; semesterNumber?: number; isElective?: boolean }>): Promise<Subject> => {
    return apiClient<Subject>(`/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },
};

