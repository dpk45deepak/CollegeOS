import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementsApi } from "@/services/api/placements.api";

export const placementKeys = {
  all: ["placements"] as const,
  companies: () => [...placementKeys.all, "companies"] as const,
  jobs: (params?: any) => [...placementKeys.all, "jobs", params] as const,
  recs: () => [...placementKeys.all, "recommendations"] as const,
  drives: () => [...placementKeys.all, "drives"] as const,
  mine: () => [...placementKeys.all, "mine"] as const,
  jobApplications: (jobId: string) => [...placementKeys.all, "applications", jobId] as const,
};

export function useCompanies() {
  return useQuery({
    queryKey: placementKeys.companies(),
    queryFn: () => placementsApi.listCompanies(),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: placementsApi.createCompany,
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.companies() }),
  });
}

export function useJobs(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: placementKeys.jobs(params),
    queryFn: () => placementsApi.listJobs(params),
  });
}

export function useJobRecommendations() {
  return useQuery({
    queryKey: placementKeys.recs(),
    queryFn: () => placementsApi.getRecommendations(),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: placementsApi.createJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.jobs() }),
  });
}

export function useApplyJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => placementsApi.applyForJob(jobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: placementKeys.mine() });
      qc.invalidateQueries({ queryKey: placementKeys.jobs() });
    },
  });
}

export function useMyJobApplications() {
  return useQuery({
    queryKey: placementKeys.mine(),
    queryFn: () => placementsApi.myApplications(),
  });
}

export function useJobApplications(jobId: string, params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: placementKeys.jobApplications(jobId),
    queryFn: () => placementsApi.getApplicationsForJob(jobId, params),
    enabled: !!jobId,
  });
}

export function usePlacementDrives() {
  return useQuery({
    queryKey: placementKeys.drives(),
    queryFn: () => placementsApi.listDrives(),
  });
}

export function useCreatePlacementDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: placementsApi.createDrive,
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.drives() }),
  });
}

export function useUpdateJobApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: string }) =>
      placementsApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.all }),
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, dto }: { applicationId: string; dto: any }) =>
      placementsApi.scheduleInterview(applicationId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.all }),
  });
}

export function useIssueOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, dto }: { applicationId: string; dto: any }) =>
      placementsApi.issueOffer(applicationId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: placementKeys.all }),
  });
}

