import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi, CreateStudentDto, UpdateStudentDto, StudentListQuery } from "@/services/api/students.api";

export const studentKeys = {
  all: ["students"] as const,
  list: (params?: StudentListQuery) => [...studentKeys.all, "list", params] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
  me: () => [...studentKeys.all, "me"] as const,
  dashboard: (wardId?: string) => [...studentKeys.all, "dashboard", wardId] as const,
  attendanceReport: (wardId?: string) => [...studentKeys.all, "attendance", wardId] as const,
  attendanceRecords: (params?: any) => [...studentKeys.all, "attendanceRecords", params] as const,
  timetable: (wardId?: string) => [...studentKeys.all, "timetable", wardId] as const,
  assignments: (params?: any) => [...studentKeys.all, "assignments", params] as const,
  exams: (wardId?: string) => [...studentKeys.all, "exams", wardId] as const,
  results: (wardId?: string) => [...studentKeys.all, "results", wardId] as const,
  fees: (wardId?: string) => [...studentKeys.all, "fees", wardId] as const,
};

export function useStudents(params?: StudentListQuery) {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentsApi.list(params),
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.getById(id),
    enabled: !!id,
  });
}

export function useStudentMe() {
  return useQuery({
    queryKey: studentKeys.me(),
    queryFn: () => studentsApi.getMe(),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStudentDto) => studentsApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.all }),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateStudentDto }) => studentsApi.update(id, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: studentKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: [...studentKeys.all, "list"] });
    },
  });
}

export function useUpdateStudentMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { phone?: string; address?: Record<string, string> }) => studentsApi.updateMe(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.me() }),
  });
}

export function useAddStudentSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; level?: number }) => studentsApi.addSkill(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.me() }),
  });
}

export function useRemoveStudentSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => studentsApi.removeSkill(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.me() }),
  });
}

export function useAddPortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => studentsApi.addPortfolioItem(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.me() }),
  });
}

export function useRemovePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsApi.removePortfolioItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: studentKeys.me() }),
  });
}

// Portal Hooks
export function useStudentDashboard(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.dashboard(wardId),
    queryFn: () => studentsApi.getDashboard(wardId),
  });
}

export function useStudentAttendanceReport(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.attendanceReport(wardId),
    queryFn: () => studentsApi.getAttendanceReport(wardId),
  });
}

export function useStudentAttendanceRecords(params?: { studentId?: string; subjectId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: studentKeys.attendanceRecords(params),
    queryFn: () => studentsApi.getAttendanceRecords(params),
  });
}

export function useStudentTimetable(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.timetable(wardId),
    queryFn: () => studentsApi.getTimetable(wardId),
  });
}

export function useStudentAssignments(params?: { studentId?: string; subjectOfferingId?: string; pending?: string }) {
  return useQuery({
    queryKey: studentKeys.assignments(params),
    queryFn: () => studentsApi.getAssignments(params),
  });
}

export function useStudentExams(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.exams(wardId),
    queryFn: () => studentsApi.getExams(wardId),
  });
}

export function useStudentResults(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.results(wardId),
    queryFn: () => studentsApi.getResults(wardId),
  });
}

export function useStudentPortalFees(wardId?: string) {
  return useQuery({
    queryKey: studentKeys.fees(wardId),
    queryFn: () => studentsApi.getFees(wardId),
  });
}
