import { apiClient } from "@/lib/api/client";

export type ExamType = "INTERNAL" | "MID_SEM" | "END_SEM" | "PRACTICAL" | "VIVA" | "MID_TERM" | "END_TERM";

export interface ExamItem {
  id: string;
  subjectOfferingId: string;
  type: ExamType;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  roomId?: string | null;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  subjectOffering?: {
    id: string;
    subject?: { code: string; name: string; credits?: number };
    section?: { name: string };
    teacher?: { user?: { firstName: string; lastName: string } };
  };
  room?: { id: string; code: string };
}

export interface ExamResultItem {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade?: string;
  gradePoints?: number;
  passed: boolean;
  status: "DRAFT" | "PUBLISHED";
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string };
  };
}

export interface GradingBand {
  min: number;
  max: number;
  grade: string;
  points: number;
}

export interface GradingScheme {
  id: string;
  name: string;
  bands: GradingBand[];
  isDefault: boolean;
}

export interface CreateExamDto {
  subjectOfferingId: string;
  type: ExamType;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  roomId?: string;
  gradingSchemeId?: string;
}

export const examsApi = {
  create: async (dto: CreateExamDto): Promise<ExamItem> => {
    const normalizedType =
      dto.type === "MID_TERM" ? "MID_SEM" : dto.type === "END_TERM" ? "END_SEM" : dto.type;
    return apiClient<ExamItem>("/exams", {
      method: "POST",
      body: JSON.stringify({
        ...dto,
        type: normalizedType,
      }),
    });
  },

  list: async (params?: { upcoming?: boolean; subjectOfferingId?: string; page?: number; limit?: number }): Promise<ExamItem[]> => {
    const raw = await apiClient<any>("/exams", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  cancel: async (id: string): Promise<ExamItem> => {
    return apiClient<ExamItem>(`/exams/${id}/cancel`, { method: "POST" });
  },

  enterResults: async (id: string, results: Array<{ studentId: string; marksObtained: number }>, reason?: string) => {
    return apiClient<any>(`/exams/${id}/results`, {
      method: "PUT",
      body: JSON.stringify({ results, reason }),
    });
  },

  getResults: async (id: string): Promise<ExamResultItem[]> => {
    const raw = await apiClient<any>(`/exams/${id}/results`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  publishResults: async (id: string) => {
    return apiClient<any>(`/exams/${id}/publish`, { method: "POST" });
  },

  listGradingSchemes: async (): Promise<GradingScheme[]> => {
    const raw = await apiClient<any>("/grading-schemes");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createGradingScheme: async (dto: { name: string; bands: GradingBand[]; isDefault?: boolean }): Promise<GradingScheme> => {
    return apiClient<GradingScheme>("/grading-schemes", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

