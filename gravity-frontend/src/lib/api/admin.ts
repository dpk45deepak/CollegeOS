import { apiClient } from "./client";

export interface AdminAttentionMetric {
  id: string;
  category: "Attendance" | "Complaints" | "Finance" | "Placements" | "Academics";
  count: number;
  label: string;
  description: string;
  severity: "high" | "medium" | "low";
  actionText: string;
  actionUrl: string;
}

export interface AdminAnalyticsData {
  enrollmentTrend: { year: string; cse: number; ece: number; me: number; civil: number }[];
  attendanceByDept: { department: string; attendance: number; target: number }[];
  cgpaDistribution: { bracket: string; students: number }[];
  feeCollectionStatus: { name: string; value: number; fill: string }[];
  placementStats: { company: string; offers: number; avgPackage: number }[];
  complaintResolutionTime: { category: string; avgHours: number; openCount: number }[];
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "HOD" | "ADMIN" | "PLACEMENT_OFFICER" | "ACCOUNTANT";
  department: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  joinedDate: string;
}

export interface TimetableConflictCheck {
  hasConflict: boolean;
  conflicts: {
    type: "TEACHER_CONFLICT" | "ROOM_CONFLICT" | "SECTION_CONFLICT";
    message: string;
    details: string;
  }[];
}

export interface AIAgentExecutionLog {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  query: string;
  intent: string;
  agentSelected: string;
  toolsUsed: string[];
  sourcesRetrieved: string[];
  responsePreview: string;
  latencyMs: number;
  status: "SUCCESS" | "FALLBACK" | "ERROR";
}

export const mockAdminAttention: AdminAttentionMetric[] = [
  {
    id: "att_1",
    category: "Attendance",
    count: 84,
    label: "Students Below 75% Threshold",
    description: "Across CSE, ECE, and Mechanical batches requiring condonation review.",
    severity: "high",
    actionText: "Review Defaulters",
    actionUrl: "/admin/analytics",
  },
  {
    id: "att_2",
    category: "Complaints",
    count: 12,
    label: "Unresolved Grievances (>48h)",
    description: "5 Infrastructure and 4 Hostel sanitation tickets overdue for escalation.",
    severity: "high",
    actionText: "Open Ticket Triage",
    actionUrl: "/student/complaints",
  },
  {
    id: "att_3",
    category: "Finance",
    count: 420000,
    label: "₹4.2L Pending Tuition Dues",
    description: "Final deadline approaches for Semester 6 fee clearance before admit cards.",
    severity: "medium",
    actionText: "Dispatch Reminders",
    actionUrl: "/admin/analytics",
  },
  {
    id: "att_4",
    category: "Placements",
    count: 3,
    label: "Active Campus Drives",
    description: "TCS Prime, Amazon SDE, and Zomato registrations in progress.",
    severity: "low",
    actionText: "Monitor Drives",
    actionUrl: "/student/placements",
  },
  {
    id: "att_5",
    category: "Academics",
    count: 17,
    label: "Overdue Grading Queues",
    description: "Continuous internal assessment lab reports pending faculty marks entry.",
    severity: "medium",
    actionText: "Notify Chairs",
    actionUrl: "/admin/academics",
  },
];

export const mockAnalyticsData: AdminAnalyticsData = {
  enrollmentTrend: [
    { year: "2023", cse: 240, ece: 180, me: 120, civil: 90 },
    { year: "2024", cse: 270, ece: 190, me: 110, civil: 85 },
    { year: "2025", cse: 320, ece: 210, me: 105, civil: 80 },
    { year: "2026", cse: 360, ece: 220, me: 95, civil: 70 },
  ],
  attendanceByDept: [
    { department: "CSE", attendance: 78.4, target: 75.0 },
    { department: "ECE", attendance: 82.1, target: 75.0 },
    { department: "Mechanical", attendance: 73.8, target: 75.0 },
    { department: "Civil", attendance: 76.5, target: 75.0 },
    { department: "Biotech", attendance: 84.0, target: 75.0 },
  ],
  cgpaDistribution: [
    { bracket: "9.0 - 10.0", students: 115 },
    { bracket: "8.0 - 8.9", students: 340 },
    { bracket: "7.0 - 7.9", students: 480 },
    { bracket: "6.0 - 6.9", students: 195 },
    { bracket: "< 6.0", students: 42 },
  ],
  feeCollectionStatus: [
    { name: "Collected (₹3.42 Cr)", value: 84, fill: "#10b981" },
    { name: "Pending (₹64 Lakh)", value: 16, fill: "#f59e0b" },
  ],
  placementStats: [
    { company: "Amazon", offers: 14, avgPackage: 28.5 },
    { company: "Microsoft", offers: 8, avgPackage: 32.0 },
    { company: "TCS Prime", offers: 142, avgPackage: 9.5 },
    { company: "Infosys", offers: 110, avgPackage: 6.8 },
    { company: "Zomato", offers: 6, avgPackage: 16.0 },
  ],
  complaintResolutionTime: [
    { category: "Infrastructure", avgHours: 36, openCount: 7 },
    { category: "Hostel", avgHours: 24, openCount: 4 },
    { category: "Library", avgHours: 12, openCount: 1 },
    { category: "Academic", avgHours: 48, openCount: 3 },
  ],
};

export const mockManagedUsers: ManagedUser[] = [
  { id: "u1", name: "Deepak Kumar", email: "deepak.k@apex.edu.in", role: "STUDENT", department: "CSE", status: "ACTIVE", joinedDate: "2023-08-10" },
  { id: "u2", name: "Dr. Vikram Sharma", email: "vikram.sharma@apex.edu.in", role: "TEACHER", department: "CSE", status: "ACTIVE", joinedDate: "2019-06-15" },
  { id: "u3", name: "Prof. Rajeshwari Sen", email: "rajeshwari.sen@apex.edu.in", role: "HOD", department: "CSE", status: "ACTIVE", joinedDate: "2014-01-20" },
  { id: "u4", name: "Prof. Ananya Iyer", email: "ananya.iyer@apex.edu.in", role: "TEACHER", department: "CSE", status: "ACTIVE", joinedDate: "2021-07-01" },
  { id: "u5", name: "Arun Mehra", email: "admin@apex.edu.in", role: "ADMIN", department: "Administration", status: "ACTIVE", joinedDate: "2018-03-12" },
  { id: "u6", name: "Pooja Malhotra", email: "tpo@apex.edu.in", role: "PLACEMENT_OFFICER", department: "Placements", status: "ACTIVE", joinedDate: "2020-09-01" },
  { id: "u7", name: "Suresh Gupta", email: "finance@apex.edu.in", role: "ACCOUNTANT", department: "Accounts", status: "ACTIVE", joinedDate: "2017-11-10" },
];

export const mockAILogs: AIAgentExecutionLog[] = [
  {
    id: "log_1",
    timestamp: "10:14 AM",
    userRole: "STUDENT",
    userName: "Deepak Kumar",
    query: "Why is my attendance low in DBMS and how many classes do I need?",
    intent: "ATTENDANCE_DEFICIT_CALCULATION",
    agentSelected: "StudentAcademicAdvisorAgent",
    toolsUsed: ["db.get_attendance_records", "attendance_calculator.solve_threshold"],
    sourcesRetrieved: ["Academic Policy 2026 (Clause 7.2)", "CS601 Attendance Log"],
    responsePreview: "Your DBMS attendance is 71.1%. You need 3 consecutive lectures to surpass the 75% threshold.",
    latencyMs: 382,
    status: "SUCCESS",
  },
  {
    id: "log_2",
    timestamp: "09:48 AM",
    userRole: "TEACHER",
    userName: "Dr. Vikram Sharma",
    query: "Show me students at risk of hall ticket debarment in Section 6A",
    intent: "CLASS_DEFICIT_ROSTER",
    agentSelected: "FacultyWorkloadAgent",
    toolsUsed: ["student_analytics.query_below_threshold"],
    sourcesRetrieved: ["CS601 Section 6A Aggregate Log"],
    responsePreview: "Found 3 students below 75%: Eshan Verma (68.2%), Deepak Kumar (71.1%), Chirag Reddy (71.4%).",
    latencyMs: 410,
    status: "SUCCESS",
  },
  {
    id: "log_3",
    timestamp: "09:12 AM",
    userRole: "STUDENT",
    userName: "Ananya Patel",
    query: "What is the procedure for medical leave condonation?",
    intent: "COLLEGE_KNOWLEDGE_SEARCH",
    agentSelected: "KnowledgeRagAgent",
    toolsUsed: ["vector_search.query_documents"],
    sourcesRetrieved: ["Academic Regulations & Evaluation Ordinance (Page 14)"],
    responsePreview: "Submit medical fitness certificate and hospital discharge slip to Dean Student Welfare within 7 days.",
    latencyMs: 295,
    status: "SUCCESS",
  },
];

export const adminApi = {
  getAttentionMetrics: () =>
    apiClient<AdminAttentionMetric[]>("/admin/attention-metrics", {}, () => mockAdminAttention),

  getAnalyticsData: () =>
    apiClient<AdminAnalyticsData>("/admin/analytics", {}, () => mockAnalyticsData),

  getUsers: () =>
    apiClient<ManagedUser[]>("/admin/users", {}, () => mockManagedUsers),

  createUser: (user: Partial<ManagedUser>) =>
    apiClient<ManagedUser>(
      "/admin/users",
      { method: "POST", body: JSON.stringify(user) },
      () => {
        const newUser: ManagedUser = {
          id: `u_${Date.now()}`,
          name: user.name || "New User",
          email: user.email || "user@apex.edu.in",
          role: user.role || "STUDENT",
          department: user.department || "General",
          status: "ACTIVE",
          joinedDate: new Date().toISOString().split("T")[0],
        };
        mockManagedUsers.unshift(newUser);
        return newUser;
      }
    ),

  checkTimetableConflict: (_data: {
    day: string;
    startTime: string;
    endTime: string;
    teacherId: string;
    room: string;
    section: string;
  }) =>
    apiClient<TimetableConflictCheck>(
      "/admin/timetables/check-conflict",
      { method: "POST" },
      () => ({
        hasConflict: false,
        conflicts: [],
      })
    ),

  getAILogs: () =>
    apiClient<AIAgentExecutionLog[]>("/admin/ai-observability/logs", {}, () => mockAILogs),
};
