import { apiClient } from "./client";
import {
  AttendanceSummary,
  TimetableSlot,
  Assignment,
  Exam,
  SemesterResult,
  FeeItem,
  Scholarship,
  PlacementOpportunity,
  Complaint,
  Notice,
  CollegeDocument,
  NotificationItem,
} from "@/types";
import {
  mockAttendanceSummary,
  mockTimetable,
  mockAssignments,
  mockExams,
  mockSemesterResults,
  mockFeeItem,
  mockScholarships,
  mockPlacements,
  mockComplaints,
  mockNotices,
  mockDocuments,
  mockNotifications,
} from "./mockData";

export const studentApi = {
  getAttendance: () =>
    apiClient<AttendanceSummary>("/students/me/attendance", {}, () => mockAttendanceSummary),

  getTimetable: () =>
    apiClient<TimetableSlot[]>("/students/me/timetable", {}, () => mockTimetable),

  getAssignments: () =>
    apiClient<Assignment[]>("/students/me/assignments", {}, () => mockAssignments),

  submitAssignment: (assignmentId: string, _fileData: { fileName: string; size: string }) =>
    apiClient<{ success: boolean; message: string }>(
      `/students/me/assignments/${assignmentId}/submit`,
      { method: "POST" },
      () => ({
        success: true,
        message: "Assignment submitted successfully. Submitted for grading.",
      })
    ),

  getExams: () => apiClient<Exam[]>("/students/me/exams", {}, () => mockExams),

  getResults: () =>
    apiClient<SemesterResult>("/students/me/results", {}, () => mockSemesterResults),

  getFees: () => apiClient<FeeItem>("/students/me/fees", {}, () => mockFeeItem),

  payFee: (_amount: number) =>
    apiClient<{ success: boolean; transactionId: string }>(
      "/students/me/fees/pay",
      { method: "POST" },
      () => ({
        success: true,
        transactionId: `TXN-${Date.now()}`,
      })
    ),

  getScholarships: () =>
    apiClient<Scholarship[]>("/students/me/scholarships", {}, () => mockScholarships),

  applyScholarship: (scholarshipId: string) =>
    apiClient<{ success: boolean; message: string }>(
      `/students/me/scholarships/${scholarshipId}/apply`,
      { method: "POST" },
      () => ({
        success: true,
        message: "Application submitted to Dean of Student Welfare office.",
      })
    ),

  getPlacements: () =>
    apiClient<PlacementOpportunity[]>("/students/me/placements", {}, () => mockPlacements),

  applyPlacement: (placementId: string) =>
    apiClient<{ success: boolean; message: string }>(
      `/students/me/placements/${placementId}/apply`,
      { method: "POST" },
      () => ({
        success: true,
        message: "Applied successfully. Resume & profile forwarded to recruiter.",
      })
    ),

  getComplaints: () =>
    apiClient<Complaint[]>("/students/me/complaints", {}, () => mockComplaints),

  createComplaint: (data: {
    category: Complaint["category"];
    subject: string;
    description: string;
    priority: Complaint["priority"];
    location?: string;
  }) =>
    apiClient<Complaint>(
      "/students/me/complaints",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      () => {
        const newComplaint: Complaint = {
          id: `cmp_${Date.now()}`,
          ticketNumber: `AIT-TKT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          category: data.category,
          subject: data.subject,
          description: data.description,
          location: data.location || "Main Campus",
          priority: data.priority,
          status: "CREATED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              title: "Complaint Logged",
              description: "Submitted through College OS",
              timestamp: "Just now",
            },
          ],
        };
        mockComplaints.unshift(newComplaint);
        return newComplaint;
      }
    ),

  getNotices: () => apiClient<Notice[]>("/notices", {}, () => mockNotices),

  getDocuments: () => apiClient<CollegeDocument[]>("/documents", {}, () => mockDocuments),

  getNotifications: () =>
    apiClient<NotificationItem[]>("/notifications", {}, () => mockNotifications),

  markNotificationRead: (id: string) =>
    apiClient<{ success: boolean }>(
      `/notifications/${id}/read`,
      { method: "PATCH" },
      () => {
        const item = mockNotifications.find((n) => n.id === id);
        if (item) item.isRead = true;
        return { success: true };
      }
    ),
};
