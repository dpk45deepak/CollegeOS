import { apiClient } from "./client";

export interface TeacherClass {
  id: string;
  subjectCode: string;
  subjectName: string;
  section: string;
  room: string;
  time: string;
  enrolledStudents: number;
  attendanceMarked: boolean;
}

export interface StudentRosterItem {
  id: string;
  rollNumber: string;
  name: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  currentAttendancePercent: number;
}

export const mockTeacherClasses: TeacherClass[] = [
  {
    id: "cls_1",
    subjectCode: "CS601",
    subjectName: "Database Management Systems",
    section: "6A",
    room: "LT-204",
    time: "10:00 AM - 11:15 AM",
    enrolledStudents: 64,
    attendanceMarked: false,
  },
  {
    id: "cls_2",
    subjectCode: "CS606",
    subjectName: "DBMS & Cloud Systems Lab",
    section: "6A-Batch 1",
    room: "Lab 3B",
    time: "02:00 PM - 04:00 PM",
    enrolledStudents: 32,
    attendanceMarked: true,
  },
  {
    id: "cls_3",
    subjectCode: "CS401",
    subjectName: "Data Structures & Algorithms",
    section: "4B",
    room: "LT-108",
    time: "11:30 AM - 12:45 PM",
    enrolledStudents: 58,
    attendanceMarked: true,
  },
];

export const mockRoster: StudentRosterItem[] = [
  { id: "s1", rollNumber: "21CS001", name: "Aarav Sharma", status: "PRESENT", currentAttendancePercent: 88.5 },
  { id: "s2", rollNumber: "21CS002", name: "Ananya Patel", status: "PRESENT", currentAttendancePercent: 92.0 },
  { id: "s3", rollNumber: "21CS008", name: "Bhavya Gupta", status: "PRESENT", currentAttendancePercent: 81.3 },
  { id: "s4", rollNumber: "21CS015", name: "Chirag Reddy", status: "ABSENT", currentAttendancePercent: 71.4 },
  { id: "s5", rollNumber: "21CS042", name: "Deepak Kumar", status: "PRESENT", currentAttendancePercent: 71.1 },
  { id: "s6", rollNumber: "21CS045", name: "Diya Roy", status: "PRESENT", currentAttendancePercent: 94.2 },
  { id: "s7", rollNumber: "21CS052", name: "Eshan Verma", status: "LATE", currentAttendancePercent: 68.2 },
  { id: "s8", rollNumber: "21CS060", name: "Farhan Ali", status: "PRESENT", currentAttendancePercent: 79.5 },
];

export const teacherApi = {
  getTodayClasses: () =>
    apiClient<TeacherClass[]>("/teachers/me/classes", {}, () => mockTeacherClasses),

  getClassRoster: (classId: string) =>
    apiClient<StudentRosterItem[]>(
      `/teachers/classes/${classId}/roster`,
      {},
      () => mockRoster
    ),

  submitAttendance: (
    _classId: string,
    _records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }[]
  ) =>
    apiClient<{ success: boolean; message: string }>(
      "/teachers/attendance/submit",
      { method: "POST" },
      () => ({
        success: true,
        message: "Attendance recorded and synced with academic server successfully.",
      })
    ),

  getPendingAssignmentsToGrade: () =>
    apiClient<{ id: string; title: string; subject: string; pendingCount: number }[]>(
      "/teachers/me/pending-evaluations",
      {},
      () => [
        { id: "eval_1", title: "B+ Tree Indexing Simulation", subject: "CS601 (6A)", pendingCount: 42 },
        { id: "eval_2", title: "SQL Complex Joins Benchmark", subject: "CS601 (6B)", pendingCount: 18 },
      ]
    ),

  getAtRiskStudents: () =>
    apiClient<{ id: string; name: string; rollNumber: string; subject: string; attendance: number; reason: string }[]>(
      "/teachers/me/students-at-risk",
      {},
      () => [
        {
          id: "s7",
          name: "Eshan Verma",
          rollNumber: "21CS052",
          subject: "CS601",
          attendance: 68.2,
          reason: "Missed 5 consecutive lectures without medical excuse",
        },
        {
          id: "s5",
          name: "Deepak Kumar",
          rollNumber: "21CS042",
          subject: "CS601",
          attendance: 71.1,
          reason: "Borderline attendance; requires next 3 classes",
        },
        {
          id: "s4",
          name: "Chirag Reddy",
          rollNumber: "21CS015",
          subject: "CS601",
          attendance: 71.4,
          reason: "Irregular Monday attendance",
        },
      ]
    ),
};
