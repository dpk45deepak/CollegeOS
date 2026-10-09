import { apiClient } from "./client";

export interface DepartmentMetrics {
  department: string;
  totalStudents: number;
  totalFaculty: number;
  avgAttendance: number;
  studentsBelow75: number;
  facultyWorkloadHours: {
    facultyName: string;
    hoursPerWeek: number;
    subjects: string[];
  }[];
  subjectPassRates: {
    subject: string;
    passRate: number;
    avgScore: number;
  }[];
}

export const mockHodMetrics: DepartmentMetrics = {
  department: "Computer Science & Engineering",
  totalStudents: 480,
  totalFaculty: 28,
  avgAttendance: 78.4,
  studentsBelow75: 38,
  facultyWorkloadHours: [
    { facultyName: "Dr. Vikram Sharma", hoursPerWeek: 16, subjects: ["DBMS", "DBMS Lab"] },
    { facultyName: "Prof. Ananya Iyer", hoursPerWeek: 18, subjects: ["Operating Systems", "Cloud Lab"] },
    { facultyName: "Dr. Alok Verma", hoursPerWeek: 14, subjects: ["Machine Learning", "AI Seminar"] },
    { facultyName: "Prof. Priya Nair", hoursPerWeek: 16, subjects: ["Compiler Design"] },
  ],
  subjectPassRates: [
    { subject: "Database Management Systems", passRate: 92.4, avgScore: 78.1 },
    { subject: "Operating Systems Internals", passRate: 88.0, avgScore: 74.5 },
    { subject: "Machine Learning & Neural Nets", passRate: 94.2, avgScore: 82.0 },
    { subject: "Compiler Design & Automata", passRate: 79.5, avgScore: 68.3 },
  ],
};

export const hodApi = {
  getDepartmentMetrics: () =>
    apiClient<DepartmentMetrics>("/hod/department/metrics", {}, () => mockHodMetrics),
};
