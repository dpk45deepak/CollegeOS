import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/services/api/analytics.api";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsKeys.all, "overview"] as const,
  attention: () => [...analyticsKeys.all, "attention"] as const,
  trend: () => [...analyticsKeys.all, "trend"] as const,
  departments: () => [...analyticsKeys.all, "departments"] as const,
  risk: () => [...analyticsKeys.all, "risk"] as const,
};

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: () => analyticsApi.getOverview(),
  });
}

export function useAttentionMetrics() {
  return useQuery({
    queryKey: analyticsKeys.attention(),
    queryFn: () => analyticsApi.getAttention(),
  });
}

export function useAttendanceTrend() {
  return useQuery({
    queryKey: analyticsKeys.trend(),
    queryFn: () => analyticsApi.getAttendanceTrend(),
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: analyticsKeys.departments(),
    queryFn: () => analyticsApi.getDepartmentBreakdown(),
  });
}

export function useAtRiskStudents() {
  return useQuery({
    queryKey: analyticsKeys.risk(),
    queryFn: () => analyticsApi.getAtRiskStudents(),
  });
}

