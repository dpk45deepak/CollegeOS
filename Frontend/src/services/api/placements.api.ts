import { apiClient } from "@/lib/api/client";

export interface CompanyItem {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
}

export interface JobItem {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  requiredSkills: string[];
  minCgpa?: number;
  maxBacklogs?: number;
  allowedDepartments?: string[];
  ctc?: number;
  location?: string;
  deadline?: string;
  company?: CompanyItem;
  _count?: { applications?: number };
}

export interface JobRecommendationItem {
  job: JobItem;
  match: {
    score: number;
    eligible: boolean;
    matchedSkills: string[];
    missingSkills: string[];
    ineligibleReasons?: string[];
  };
}

export interface JobApplicationItem {
  id: string;
  jobId: string;
  studentId: string;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "OFFERED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  appliedAt: string;
  job?: JobItem;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
  };
  interviews?: Array<{
    id: string;
    scheduledAt: string;
    mode: "ONLINE" | "ONSITE";
    round?: number;
  }>;
  offers?: Array<{
    id: string;
    ctc: number;
    status: string;
    issuedAt: string;
  }>;
  offer?: {
    id: string;
    ctc: number;
    issuedAt: string;
  };
}

export interface PlacementDriveItem {
  id: string;
  jobId: string;
  driveDate: string;
  venue?: string;
  job?: JobItem;
}

export const placementsApi = {
  createCompany: async (dto: { name: string; website?: string; industry?: string }): Promise<CompanyItem> => {
    return apiClient<CompanyItem>("/placements/companies", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listCompanies: async (): Promise<CompanyItem[]> => {
    const raw = await apiClient<any>("/placements/companies");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createJob: async (dto: {
    companyId: string;
    title: string;
    description?: string;
    requiredSkills: string[];
    minCgpa?: number;
    maxBacklogs?: number;
    allowedDepartments?: string[];
    ctc?: number;
    location?: string;
    deadline?: string;
  }): Promise<JobItem> => {
    return apiClient<JobItem>("/placements/jobs", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listJobs: async (params?: { search?: string; page?: number; limit?: number }): Promise<JobItem[]> => {
    const raw = await apiClient<any>("/placements/jobs", { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  getRecommendations: async (): Promise<JobRecommendationItem[]> => {
    const raw = await apiClient<any>("/placements/jobs/recommendations");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  applyForJob: async (jobId: string) => {
    return apiClient<any>(`/placements/jobs/${jobId}/apply`, { method: "POST" });
  },

  getApplicationsForJob: async (jobId: string, params?: { search?: string; page?: number; limit?: number }): Promise<JobApplicationItem[]> => {
    const raw = await apiClient<any>(`/placements/jobs/${jobId}/applications`, { params });
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  createDrive: async (dto: { jobId: string; driveDate: string; venue?: string }): Promise<PlacementDriveItem> => {
    return apiClient<PlacementDriveItem>("/placements/drives", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  listDrives: async (): Promise<PlacementDriveItem[]> => {
    const raw = await apiClient<any>("/placements/drives");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  myApplications: async (): Promise<JobApplicationItem[]> => {
    const raw = await apiClient<any>("/placements/applications/mine");
    return Array.isArray(raw) ? raw : raw?.items || raw?.data || [];
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    return apiClient<any>(`/placements/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  scheduleInterview: async (applicationId: string, dto: { scheduledAt: string; mode: "ONLINE" | "ONSITE"; round?: number }) => {
    return apiClient<any>(`/placements/applications/${applicationId}/interviews`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  issueOffer: async (applicationId: string, dto: { ctc: number }) => {
    return apiClient<any>(`/placements/applications/${applicationId}/offers`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};

