import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/services/api/attendance.api";

export const attendanceKeys = {
  all: ["attendance"] as const,
  session: (offeringId: string, date: string) => [...attendanceKeys.all, "session", offeringId, date] as const,
  corrections: (params?: any) => [...attendanceKeys.all, "corrections", params] as const,
  shortage: (params?: any) => [...attendanceKeys.all, "shortage", params] as const,
  studentReport: (id: string) => [...attendanceKeys.all, "report", id] as const,
  studentRecords: (id: string, params?: any) => [...attendanceKeys.all, "records", id, params] as const,
};

export function useAttendanceSession(offeringId: string, date: string) {
  return useQuery({
    queryKey: attendanceKeys.session(offeringId, date),
    queryFn: () => attendanceApi.getSession(offeringId, date),
    enabled: !!offeringId && !!date,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.mark,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: attendanceKeys.session(vars.subjectOfferingId, vars.date) });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useAttendanceCorrections(params?: { studentId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: attendanceKeys.corrections(params),
    queryFn: () => attendanceApi.listCorrections(params),
  });
}

export function useRequestAttendanceCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.requestCorrection,
    onSuccess: () => qc.invalidateQueries({ queryKey: attendanceKeys.corrections() }),
  });
}

export function useReviewAttendanceCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { approve: boolean; note?: string } }) =>
      attendanceApi.reviewCorrection(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.corrections() });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useAttendanceShortage(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: attendanceKeys.shortage(params),
    queryFn: () => attendanceApi.getShortageAnalytics(params),
  });
}

