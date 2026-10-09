import { AIChatMessage } from "@/types";

export interface AISuggestion {
  label: string;
  prompt: string;
}

export const defaultSuggestedPrompts: AISuggestion[] = [
  { label: "Why is my attendance low?", prompt: "Why is my attendance low in DBMS and how many classes do I need to attend?" },
  { label: "What is due this week?", prompt: "What assignments and deliverables are due this week?" },
  { label: "When is my next exam?", prompt: "When is my next exam and where is my seat allocated?" },
  { label: "Find scholarships for me", prompt: "Find scholarships matching my current CGPA and background." },
  { label: "Check pending fees", prompt: "What are my pending fee dues and when is the deadline?" },
  { label: "How to raise a grievance?", prompt: "How do I raise a grievance regarding lab equipment?" },
];

export const aiResponsesDatabase: Record<
  string,
  {
    content: string;
    isOfficial: boolean;
    isRecommendation: boolean;
    citations?: { title: string; source: string; page?: number; excerpt?: string }[];
    toolExecution?: {
      toolName: string;
      status: "executing" | "completed";
      summary: string;
      data?: Record<string, unknown>;
    };
  }
> = {
  attendance: {
    content: `Your current attendance in **Database Management Systems (CS601)** is **71.1%** (32 attended out of 45 held).

The college statutory regulation strictly mandates a minimum of **75.0%** for regular semester examination eligibility.

### Recovery Calculation:
- You need to attend **3 consecutive upcoming lectures** to reach **75.0%** (35 / 48).
- If you attend the next **5 classes**, your attendance will rise safely to **77.1%**.
- **Crucial Note:** You have **0 safe classes** left to miss in this subject.`,
    isOfficial: false,
    isRecommendation: true,
    citations: [
      {
        title: "Academic Regulations & Evaluation Ordinance",
        source: "Clause 7.2 - Minimum Attendance & Debarment Protocol",
        page: 12,
        excerpt: "Students with less than 75% attendance in any course shall be debarred from writing the end-semester examination in that course.",
      },
      {
        title: "Real-time Attendance Register",
        source: "Department of CSE Biometric Logs, Course CS601",
        excerpt: "Current Record: 32 Present, 11 Absent, 2 Late out of 45 conducted sessions.",
      },
    ],
    toolExecution: {
      toolName: "attendance_calculator.solve_threshold",
      status: "completed",
      summary: "Evaluated threshold model for CS601 (current: 71.1%, target: 75.0%)",
      data: {
        subject: "CS601",
        currentAttended: 32,
        totalClasses: 45,
        targetPercentage: 75,
        requiredConsecutive: 3,
        safeBunks: 0,
      },
    },
  },
  assignments: {
    content: `Here are your pending course deliverables:

1. **B+ Tree Indexing & Query Cost Optimization (CS601)**
   - **Instructor:** Dr. Vikram Sharma
   - **Deadline:** Tomorrow, October 10 at 11:59 PM (⏳ *Due in ~28 hours*)
   - **Marks:** 25 Marks
   - **Status:** Not yet submitted

2. **Transformer Attention Head Visualization (CS603)**
   - **Instructor:** Dr. Alok Verma
   - **Deadline:** October 15 at 11:59 PM
   - **Marks:** 50 Marks

Would you like me to open the submission portal for the B+ Tree assignment or generate an outline?`,
    isOfficial: true,
    isRecommendation: false,
    citations: [
      {
        title: "CSE Semester 6 Course Management System",
        source: "Active Assignment Registry",
        excerpt: "CS601 Assignment #3 published Oct 2, deadline Oct 10 23:59 IST.",
      },
    ],
    toolExecution: {
      toolName: "lms.get_pending_assignments",
      status: "completed",
      summary: "Queried LMS database for student 21CS042",
      data: { pendingCount: 2, urgentCount: 1 },
    },
  },
  exams: {
    content: `Here is your upcoming Mid-Term Examination schedule:

- **Database Management Systems (CS601)**
  - **Date & Time:** Friday, October 16, 2026 | 10:00 AM – 12:00 PM
  - **Location:** Examination Hall 4 (Desk 42)
  - **Admit Card ID:** \`AIT-21CS042\`
  - **Syllabus Focus:** Relational Algebra, SQL-99, 3NF/BCNF Decomposition, Concurrency Control (2PL)

- **Machine Learning & Neural Nets (CS603)**
  - **Date & Time:** Sunday, October 18, 2026 | 02:00 PM – 04:00 PM
  - **Location:** Examination Hall 2 (Desk 18)`,
    isOfficial: true,
    isRecommendation: false,
    citations: [
      {
        title: "Controller of Examinations Notice",
        source: "Mid-Term Autumn Exam Schedule Notification Ref #CoE/2026/89",
        page: 2,
      },
    ],
  },
  scholarships: {
    content: `Based on your academic profile (**CGPA: 8.64**, Semester 6, CSE department, zero active backlogs):

### Top Matched Scholarship:
🎯 **Apex Merit Excellence Award 2026** — **94% Match**
- **Grant Amount:** ₹50,000
- **Deadline:** October 30, 2026
- **Why you match:** Requires CGPA > 8.5 (You: 8.64) and clean disciplinary record.
- **Documents required:** Semester 1-5 Grade Cards, Faculty Recommendation Letter.

Would you like me to draft your application and pre-fill your academic details?`,
    isOfficial: false,
    isRecommendation: true,
    citations: [
      {
        title: "Apex Educational Foundation Trust",
        source: "Merit Grant Scheme 2026 Guidelines",
      },
    ],
    toolExecution: {
      toolName: "scholarship_matcher.evaluate_student_profile",
      status: "completed",
      summary: "Matched profile with 14 active scholarship schemes",
      data: { bestMatch: "Apex Merit Excellence Award 2026", score: 94 },
    },
  },
  fees: {
    content: `### Fee Status for Academic Year 2025-2026:
- **Total Semester 6 Fee:** ₹92,500
- **Amount Paid:** ₹80,000 (across 2 installments)
- **Pending Balance:** **₹12,500**
- **Due Date:** October 25, 2026

*Note: Paying before October 20 ensures immediate admit card clearance without manual finance counter endorsement.*`,
    isOfficial: true,
    isRecommendation: false,
    citations: [
      {
        title: "Apex Finance & Accounts Ledger",
        source: "Student Ledger #STU-2021-042",
      },
    ],
  },
};

export const aiApi = {
  sendMessage: async (
    userMessage: string,
    history: AIChatMessage[] = []
  ): Promise<AIChatMessage> => {
    // Artificial realistic latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const lower = userMessage.toLowerCase();
    let template = aiResponsesDatabase.attendance;

    if (lower.includes("exam") || lower.includes("test") || lower.includes("seat")) {
      template = aiResponsesDatabase.exams;
    } else if (lower.includes("assignment") || lower.includes("due") || lower.includes("homework")) {
      template = aiResponsesDatabase.assignments;
    } else if (lower.includes("scholarship") || lower.includes("grant") || lower.includes("aid")) {
      template = aiResponsesDatabase.scholarships;
    } else if (lower.includes("fee") || lower.includes("payment") || lower.includes("dues") || lower.includes("money")) {
      template = aiResponsesDatabase.fees;
    } else if (lower.includes("attendance") || lower.includes("bunk") || lower.includes("class") || lower.includes("dbms")) {
      template = aiResponsesDatabase.attendance;
    } else {
      // General intelligent assistant fallback
      return {
        id: `msg_${Date.now()}`,
        sender: "assistant",
        content: `I've analyzed your question across the Apex College Knowledge Base and your active student records.

Regarding **"${userMessage}"**:
College guidelines emphasize timely completion of academic milestones. For specific procedural forms, you can download official templates in the **Documents** section, or raise a student support ticket under **Complaints**.

Is there a specific department, faculty member, or course code you'd like me to look up?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isOfficial: false,
        isRecommendation: true,
        citations: [
          {
            title: "Apex Knowledge Repository",
            source: "Student Handbook 2026",
            page: 4,
          },
        ],
        quickActions: [
          { label: "View Attendance", prompt: "Why is my attendance low in DBMS?" },
          { label: "View Timetable", prompt: "What classes do I have today?" },
          { label: "Check Fee Dues", prompt: "What are my pending fees?" },
        ],
      };
    }

    return {
      id: `msg_${Date.now()}`,
      sender: "assistant",
      content: template.content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOfficial: template.isOfficial,
      isRecommendation: template.isRecommendation,
      citations: template.citations,
      toolExecution: template.toolExecution,
      quickActions: [
        { label: "Ask about next exam", prompt: "When is my next exam?" },
        { label: "Check scholarships", prompt: "Find scholarships for me" },
      ],
    };
  },
};
