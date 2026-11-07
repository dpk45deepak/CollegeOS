import { apiClient } from "@/lib/api/client";

export interface RubricItem {
  criterion: string;
  maxMarks: number;
}

export interface AssignmentItem {
  id: string;
  subjectOfferingId: string;
  title: string;
  description?: string;
  dueAt: string;
  maxMarks: number;
  rubric?: RubricItem[];
  attachmentKeys?: string[];
  createdAt: string;
  subjectOffering?: {
    id: string;
    subject?: { code: string; name: string };
    teacher?: { user?: { firstName: string; lastName: string } };
    section?: { name: string };
  };
  submission?: {
    id: string;
    status: "SUBMITTED" | "LATE" | "GRADED";
    marks?: number;
    feedback?: string;
    submittedAt: string;
  };
}

export interface SubmissionItem {
  id: string;
  assignmentId: string;
  studentId: string;
  status: "SUBMITTED" | "LATE" | "GRADED";
  marks?: number;
  feedback?: string;
  submittedAt: string;
  text?: string;
  fileKeys?: string[];
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface CreateAssignmentDto {
  subjectOfferingId: string;
  title: string;
  description?: string;
  dueAt: string;
  maxMarks: number;
  rubric?: RubricItem[];
  attachmentKeys?: string[];
}

export const assignmentsApi = {
  create: async (dto: CreateAssignmentDto): Promise<AssignmentItem> => {
    return apiClient<AssignmentItem>("/assignments", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  list: async (params?: { subjectOfferingId?: string; pending?: string; page?: number; limit?: number }): Promise<AssignmentItem[]> => {
    const raw = await apiClient<any>("/assignments", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  submit: async (assignmentId: string, dto: { text?: string; fileKeys?: string[] }) => {
    return apiClient<any>(`/assignments/${assignmentId}/submit`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  getSubmissions: async (assignmentId: string, params?: { page?: number; limit?: number }): Promise<SubmissionItem[]> => {
    const raw = await apiClient<any>(`/assignments/${assignmentId}/submissions`, { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getMissingSubmissions: async (assignmentId: string) => {
    const raw = await apiClient<any>(`/assignments/${assignmentId}/missing`);
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  gradeSubmission: async (submissionId: string, dto: { marks: number; feedback?: string }) => {
    return apiClient<any>(`/assignments/submissions/${submissionId}/grade`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

