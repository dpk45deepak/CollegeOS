export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "HOD"
  | "ADMIN"
  | "PLACEMENT_OFFICER"
  | "ACCOUNTANT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  department?: string;
  semester?: number;
  rollNumber?: string;
  employeeId?: string;
  designation?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AttendanceSubject {
  id: string;
  code: string;
  name: string;
  instructor: string;
  totalClasses: number;
  attended: number;
  absent: number;
  late: number;
  percentage: number;
  requiredPercentage: number;
  safeToMiss: number;
  needToAttend: number;
  history: {
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    time: string;
  }[];
}

export interface AttendanceSummary {
  overallPercentage: number;
  requiredPercentage: number;
  totalHeld: number;
  totalAttended: number;
  subjects: AttendanceSubject[];
  trend: {
    week: string;
    percentage: number;
  }[];
}

export interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  room: string;
  instructor: string;
  type: "Lecture" | "Lab" | "Tutorial";
}

export interface Assignment {
  id: string;
  subjectCode: string;
  subjectName: string;
  title: string;
  description: string;
  teacherName: string;
  dueDate: string;
  totalMarks: number;
  status: "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";
  submittedAt?: string;
  obtainedMarks?: number;
  feedback?: string;
  attachments?: {
    name: string;
    url: string;
    size: string;
  }[];
  submissionFile?: {
    name: string;
    url: string;
    uploadedAt: string;
  };
}

export interface Exam {
  id: string;
  subjectCode: string;
  subjectName: string;
  examType: "Mid-Term" | "End-Term" | "Practical" | "Internal";
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  seatNumber: string;
  maxMarks: number;
  syllabus: string;
  status: "UPCOMING" | "COMPLETED";
}

export interface ResultItem {
  subjectCode: string;
  subjectName: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: string;
  gradePoint: number;
}

export interface SemesterResult {
  semester: number;
  sgpa: number;
  cgpa: number;
  academicYear: string;
  results: ResultItem[];
  aiInsights: {
    strongestSubject: string;
    needsImprovementSubject: string;
    summary: string;
  };
}

export interface FeeItem {
  id: string;
  semester: number;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  breakdown: {
    head: string;
    amount: number;
  }[];
  transactions: {
    id: string;
    date: string;
    amount: number;
    receiptNo: string;
    method: string;
    status: "SUCCESS" | "PENDING";
  }[];
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: number;
  deadline: string;
  matchScore: number; // percentage (e.g. 92%)
  eligibilitySummary: string;
  requirements: string[];
  documentsNeeded: string[];
  status: "ELIGIBLE" | "APPLIED" | "SHORTLISTED" | "SAVED";
  aiReasoning: string;
}

export interface PlacementOpportunity {
  id: string;
  company: string;
  role: string;
  location: string;
  ctc: string; // e.g. "12 LPA"
  matchScore: number;
  deadline: string;
  eligibilityCriteria: {
    minCgpa: number;
    backlogsAllowed: number;
    eligibleBranches: string[];
  };
  requiredSkills: string[];
  status: "RECOMMENDED" | "APPLIED" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "OFFERED" | "CLOSED";
  rounds: {
    name: string;
    date: string;
    completed: boolean;
  }[];
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  category: "Academic" | "Hostel" | "Infrastructure" | "Library" | "Fee" | "Ragging/Harassment";
  subject: string;
  description: string;
  location?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "CREATED" | "ASSIGNED" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  timeline: {
    title: string;
    description: string;
    timestamp: string;
  }[];
  studentFeedback?: {
    rating: number;
    comment: string;
  };
}

export interface Notice {
  id: string;
  title: string;
  department: string;
  date: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  content: string;
  attachments?: {
    name: string;
    size: string;
    url: string;
  }[];
  isRead?: boolean;
}

export interface CollegeDocument {
  id: string;
  title: string;
  category: "Curriculum" | "Policy" | "Form" | "Academic Calendar" | "Exam Guideline";
  department: string;
  academicYear: string;
  uploadedAt: string;
  fileSize: string;
  fileType: string;
  url: string;
  summary: string;
}

export interface NotificationItem {
  id: string;
  type:
    | "attendance_warning"
    | "assignment_deadline"
    | "exam_alert"
    | "fee_reminder"
    | "placement_alert"
    | "complaint_update"
    | "scholarship_deadline"
    | "general";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  isOfficial?: boolean;
  isRecommendation?: boolean;
  citations?: {
    title: string;
    source: string;
    page?: number;
    excerpt?: string;
  }[];
  toolExecution?: {
    toolName: string;
    status: "executing" | "completed";
    summary: string;
    data?: Record<string, unknown>;
  };
  quickActions?: {
    label: string;
    prompt: string;
  }[];
}
