# College OS — Cross-Module Integration Workflows

This document details the multi-module business workflows in College OS, tracing how mutations in one domain propagate and reflect across other modules in the database and frontend user experiences.

---

## 1. Student Onboarding & Academic Activation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as College Admin / Registrar
    participant UI as Admin Users UI (/admin/users)
    participant API as Students API (/api/v1/students)
    participant DB as Prisma (User, Student, Guardians)
    participant Auth as Auth / Session
    participant StudentUI as Student Portal (/student/dashboard)

    Admin->>UI: Fill Student Onboarding Form (Roll No, Email, Dept, Program, Batch, Section, Guardians, Initial Password)
    UI->>API: POST /students
    API->>DB: Transaction: Create User record + Student profile + Guardian records + Assign STUDENT role
    DB-->>API: Student Created with UUID
    API-->>UI: 201 Created (Envelope wrapped)
    UI-->>Admin: Success Notification & Updated Directory

    Note over Auth, StudentUI: Student Authenticates
    StudentUI->>Auth: POST /auth/login (loginId + initialPassword)
    Auth-->>StudentUI: JWT Access Token + Refresh Token
    StudentUI->>API: GET /students/me/dashboard
    API->>DB: Query Student Profile, Enrolled Offerings, Attendance, Timetable
    DB-->>API: Real Aggregated Data
    API-->>StudentUI: Verified Student Dashboard Loaded
```

### Verification & Constraints
- Duplicate prevention: College Student ID, Roll Number, and Email are unique across the tenant. Retries return 409 Conflict.
- Relational integrity: Department, Program, Batch, and Section IDs must exist.
- Auth sync: Creating a student provisions a linked login account in `User` and generates a `STUDENT` role in `UserRole`.

---

## 2. Faculty Assignment & Timetable Allocation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as College Admin / Academic Dean
    actor Teacher as Faculty Member
    participant UI as Admin Academics UI (/admin/academics)
    participant T_API as Teachers API (/api/v1/teachers)
    participant TT_API as Timetable API (/api/v1/timetable)
    participant TeacherUI as Faculty Dashboard (/teacher/dashboard)

    Admin->>UI: Create Teacher Profile (Employee ID, Dept, Designation)
    UI->>T_API: POST /teachers
    T_API-->>UI: Teacher Created

    Admin->>UI: Assign Teacher to Subject & Section (SubjectOffering)
    UI->>T_API: POST /subject-offerings {subjectId, sectionId, teacherId, semesterId, enrollSection: true}
    T_API-->>UI: SubjectOffering Created + Section Roster Auto-Enrolled

    Admin->>UI: Schedule Lecture Slot in Room
    UI->>TT_API: POST /timetable/check (Dry run conflict engine)
    TT_API-->>UI: 200 OK (hasConflict: false)
    UI->>TT_API: POST /timetable/slots {subjectOfferingId, roomId, dayOfWeek, startMinute, endMinute}
    TT_API-->>UI: 201 Created

    Teacher->>TeacherUI: Log in to Teacher Portal
    TeacherUI->>T_API: GET /subject-offerings
    TeacherUI->>TT_API: GET /timetable/teachers/me
    TT_API-->>TeacherUI: Allocated Classes & Live Timetable Reflected
```

### Verification & Constraints
- Conflict engine enforces zero overlap for teachers, rooms, and student sections.
- Roster automatic enrollment populates `Enrollment` records linking all section students to the offering.

---

## 3. Lecture Attendance, 75% Threshold & Correction Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Faculty Member
    actor Student as Enrolled Student
    actor HOD as Department HOD
    participant T_UI as Teacher Attendance UI (/teacher/attendance)
    participant Att_API as Attendance API (/api/v1/attendance)
    participant S_UI as Student Attendance UI (/student/attendance)
    participant HOD_UI as HOD Dashboard (/hod/dashboard)

    Teacher->>T_UI: Open Subject Offering Roster for Lecture Date
    T_UI->>Att_API: GET /subject-offerings/:id/students
    Att_API-->>T_UI: Roster Loaded
    Teacher->>T_UI: Mark Attendance (Present / Absent / Late) & Submit
    T_UI->>Att_API: POST /attendance {subjectOfferingId, date, records}
    Att_API-->>T_UI: 200 OK (Records committed)

    Student->>S_UI: View Attendance Report
    S_UI->>Att_API: GET /students/me/attendance
    Att_API-->>S_UI: Calculated Percentage, Safe to Miss, Classes Needed to 75%
    Student->>S_UI: Submit Correction Request for Disputed Lecture
    S_UI->>Att_API: POST /attendance/correction-request {attendanceId, newStatus, reason}
    Att_API-->>S_UI: 201 Created

    HOD->>HOD_UI: Review Pending Department Corrections
    HOD_UI->>Att_API: GET /attendance/corrections
    Att_API-->>HOD_UI: Pending List with Old & New Values
    HOD->>HOD_UI: Approve Correction Request
    HOD_UI->>Att_API: POST /attendance/corrections/:id/review {approve: true, note}
    Att_API-->>HOD_UI: 200 OK (Audited & Updated)
    Note over S_UI: Next refresh displays updated percentage and recalculated shortage
```

---

## 4. Assignment Creation, Submission & Grading Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Faculty Member
    actor Student as Student
    participant T_UI as Teacher Assignments UI (/teacher/assignments)
    participant S_UI as Student Assignments UI (/student/assignments)
    participant API as Assignments API (/api/v1/assignments)
    participant Storage as Storage API (/api/v1/files/attachments)

    Teacher->>T_UI: Create Assignment (Title, Description, Due Date, Max Marks, Rubric)
    T_UI->>API: POST /assignments
    API-->>T_UI: Assignment Created & Enrolled Students Notified

    Student->>S_UI: View Pending Assignment
    S_UI->>API: GET /students/me/assignments
    API-->>S_UI: Assignment Details with Pending Status
    Student->>S_UI: Select Submission File
    S_UI->>Storage: POST /files/attachments (Multipart file upload)
    Storage-->>S_UI: Storage Key { key: "att_xyz" }
    Student->>S_UI: Submit Work with Storage Key
    S_UI->>API: POST /assignments/:id/submit {fileKeys: ["att_xyz"], text: "Notes"}
    API-->>S_UI: 200 OK (Marked SUBMITTED, timestamp recorded)

    Teacher->>T_UI: Open Submissions List
    T_UI->>API: GET /assignments/:id/submissions
    API-->>T_UI: Submissions with Files & Submission Time
    Teacher->>T_UI: Enter Marks (e.g. 95) & Feedback
    T_UI->>API: POST /assignments/submissions/:submissionId/grade {marks: 95, feedback: "Excellent"}
    API-->>T_UI: 200 OK

    Student->>S_UI: Refresh View
    S_UI->>API: GET /students/me/assignments
    API-->>S_UI: Status GRADED, Marks: 95/100, Feedback visible
```

---

## 5. Examination, Result Publication & CGPA Recalculation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Examination Officer
    actor Teacher as Faculty Evaluator
    actor Student as Student
    participant UI as Exams UI (/student/exams, /admin)
    participant ExamAPI as Examinations API (/api/v1/exams)
    participant ResultAPI as Results API (/api/v1/students/me/results)

    Admin->>UI: Schedule Examination (Mid-Term / End-Term, Offering, Date, Duration, Max/Pass Marks)
    UI->>ExamAPI: POST /exams
    ExamAPI-->>UI: Exam Scheduled & Calendar Updated

    Teacher->>UI: Open Exam Marks Entry
    UI->>ExamAPI: PUT /exams/:id/results {results: [{studentId, marksObtained}]}
    ExamAPI-->>UI: 200 OK (Saved as DRAFT, grades calculated via GradingScheme)

    Admin->>UI: Publish Examination Results
    UI->>ExamAPI: POST /exams/:id/publish
    ExamAPI-->>UI: Results Published, Semester SGPA/CGPA Recalculated, Students Notified

    Student->>UI: View Official Semester Grade Card
    UI->>ResultAPI: GET /students/me/results
    ResultAPI-->>UI: SGPA, CGPA, Breakdown, Pass Status, Credit Points Verified
```

---

## 6. Grievance Lodging, Routing & Resolution Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    actor Staff as Desk In-Charge / HOD
    participant S_UI as Student Grievances UI (/student/complaints)
    participant API as Complaints API (/api/v1/complaints)
    participant Staff_UI as Admin / HOD Complaint Queue

    Student->>S_UI: Enter Complaint Text
    S_UI->>API: POST /complaints/route-preview {text}
    API-->>S_UI: Category, Priority, Responsible Desk, SLA Previewed
    Student->>S_UI: Confirm & Submit Complaint
    S_UI->>API: POST /complaints {subject, description, category, priority}
    API-->>S_UI: Ticket Generated (e.g. GRV-2026-00001)

    Staff->>Staff_UI: Open Work Queue
    Staff_UI->>API: GET /complaints
    Staff_UI->>API: POST /complaints/:id/status {status: "INVESTIGATING", note: "Investigating"}
    Staff_UI->>API: POST /complaints/:id/comments {note: "Maintenance scheduled"}
    Staff_UI->>API: POST /complaints/:id/status {status: "RESOLVED", note: "Issue fixed"}

    Student->>S_UI: View Ticket Updates & Provide Feedback
    S_UI->>API: POST /complaints/:id/feedback {rating: 5, comment: "Promptly resolved"}
    API-->>S_UI: Ticket Closed with Rating
```

---

## 7. Fee Billing, Online Payment & Instant Receipt Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Accountant
    actor Student as Student
    participant FeeAPI as Fees API (/api/v1/fees)
    participant S_UI as Student Fees UI (/student/fees)

    Admin->>FeeAPI: POST /fees/structures (Name, Components: Tuition, Lab, Library)
    Admin->>FeeAPI: POST /fees/structures/:id/assign {batchId, dueDate}
    FeeAPI-->>Admin: StudentFee records created for all students of batch

    Student->>S_UI: View Outstanding Fees & Component Breakdown
    S_UI->>FeeAPI: GET /students/me/fees
    Student->>S_UI: Click "Pay Now"
    S_UI->>FeeAPI: POST /fees/:studentFeeId/payments {gateway: "mock", amount}
    FeeAPI-->>S_UI: Hosted Payment URL & Transaction Record Initialized
    Note over S_UI, FeeAPI: Gateway completes payment webhook
    FeeAPI->>FeeAPI: Process Webhook -> Payment marked SUCCESS, StudentFee updated
    Student->>S_UI: Download Official Receipt
    S_UI->>FeeAPI: GET /fees/payments/:id/receipt
    FeeAPI-->>S_UI: Receipt JSON / PDF with Transaction Details
```

