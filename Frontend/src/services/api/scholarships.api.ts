import { apiClient } from "@/lib/api/client";

export type ScholarshipType = "MERIT" | "NEED_BASED" | "SPORTS" | "MINORITY" | "GOVERNMENT" | "INSTITUTIONAL";

export interface ScholarshipItem {
  id: string;
  type: ScholarshipType;
  name: string;
  provider: string;
  description?: string;
  eligibility?: Record<string, any>;
  eligibilityText?: string;
  requiredDocuments: string[];
  amount?: number;
  deadline?: string;
  url?: string;
  isActive: boolean;
  _count?: { applications?: number };
}

export interface ScholarshipMatchItem {
  scholarship: ScholarshipItem;
  eligible: boolean;
  criteriaResults: Array<{
    criterion: string;
    met: boolean;
    reason: string;
  }>;
}

export interface ScholarshipApplicationItem {
  id: string;
  scholarshipId: string;
  studentId: string;
  status: "APPLIED" | "INTERESTED" | "APPROVED" | "REJECTED" | "DISBURSED";
  appliedAt: string;
  scholarship?: ScholarshipItem;
  student?: {
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

export interface CreateScholarshipDto {
  type: ScholarshipType;
  name: string;
  provider: string;
  description?: string;
  eligibility?: Record<string, any>;
  eligibilityText?: string;
  requiredDocuments: string[];
  amount?: number;
  deadline?: string;
  url?: string;
  isActive?: boolean;
}

export const scholarshipsApi = {
  list: async (params?: { type?: ScholarshipType; search?: string; page?: number; limit?: number }): Promise<ScholarshipItem[]> => {
    const raw = await apiClient<any>("/scholarships", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  matchesForStudent: async (): Promise<ScholarshipMatchItem[]> => {
    const raw = await apiClient<any>("/scholarships/matches");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  myApplications: async (): Promise<ScholarshipApplicationItem[]> => {
    const raw = await apiClient<any>("/scholarships/applications/mine");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  expressInterest: async (scholarshipId: string) => {
    return apiClient<any>(`/scholarships/${scholarshipId}/interest`, { method: "POST" });
  },

  apply: async (scholarshipId: string) => {
    return apiClient<any>(`/scholarships/${scholarshipId}/apply`, { method: "POST" });
  },

  create: async (dto: CreateScholarshipDto): Promise<ScholarshipItem> => {
    return apiClient<ScholarshipItem>("/scholarships", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  update: async (id: string, dto: Partial<CreateScholarshipDto>): Promise<ScholarshipItem> => {
    return apiClient<ScholarshipItem>(`/scholarships/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    });
  },

  recordDecision: async (scholarshipId: string, studentId: string, status: "APPROVED" | "REJECTED" | "DISBURSED") => {
    return apiClient<any>(`/scholarships/${scholarshipId}/applications/${studentId}/decision`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  },
};

