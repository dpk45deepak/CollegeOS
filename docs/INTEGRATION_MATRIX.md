# College OS — Feature & API Integration Matrix

This matrix tracks each frontend capability against its underlying NestJS API endpoint, authentication requirements, database models, implementation status, and test verification.

| Module | Frontend Screen / Feature | NestJS API Route | HTTP Verb | Auth & Permissions | Database Models | Status | Test Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | Institutional Sign In | `/api/v1/auth/login` | `POST` | Public / Rate-limited | `User`, `Role`, `College` | **Implemented & Verified** | `auth.service.spec.ts`, `auth-session.test.ts` |
| **Auth** | Session Hydration & Profile | `/api/v1/users/me` | `GET` | Bearer JWT | `User`, `UserRole`, `Role` | **Implemented & Verified** | `auth.service.spec.ts`, `auth-session.test.ts` |
| **Auth** | Token Rotation | `/api/v1/auth/refresh` | `POST` | Valid Refresh Token | `Session`, `User` | **Implemented & Verified** | `auth.service.spec.ts`, `auth-session.test.ts` |
| **Auth** | Logout & Session Revocation | `/api/v1/auth/logout` | `POST` | Bearer JWT | `Session` | **Implemented & Verified** | `auth.service.spec.ts` |
| **Student** | Student Unified Dashboard | `/api/v1/students/me/dashboard` | `GET` | `STUDENT_VIEW_OWN` | Aggregates `Attendance`, `Exam`, `Fee`, `Notice` | **Implemented & Verified** | `portal.controller`, `vitest` |
| **Student** | Subject Attendance & Shortage | `/api/v1/students/me/attendance` | `GET` | `ATTENDANCE_VIEW_OWN` | `Attendance`, `SubjectOffering`, `College` | **Implemented & Verified** | `attendance-math.spec.ts`, `attendance.test.ts` |
| **Student** | Dynamic Class Timetable | `/api/v1/students/me/timetable` | `GET` | `TIMETABLE_VIEW` | `TimetableSlot`, `Room`, `Teacher` | **Implemented & Verified** | `conflicts.spec.ts` |
| **Student** | Course Deliverables & Due Dates | `/api/v1/students/me/assignments` | `GET` | `ASSIGNMENT_VIEW` | `Assignment`, `Submission` | **Implemented & Verified** | `assignments.service` |
| **Student** | Assignment Submission | `/api/v1/assignments/:id/submit` | `POST` | `ASSIGNMENT_SUBMIT` | `Submission` | **Implemented & Verified** | `file-validation.spec.ts` |
| **Student** | Examinations & Seat Allocations | `/api/v1/students/me/exams` | `GET` | `EXAM_VIEW` | `Exam`, `Room`, `SubjectOffering` | **Implemented & Verified** | `grading.spec.ts` |
| **Student** | Semester Results & SGPA/CGPA | `/api/v1/students/me/results` | `GET` | `RESULT_VIEW_OWN` | `ExamResult`, `Student` | **Implemented & Verified** | `grading.spec.ts` |
| **Student** | Fee Invoices & Payment Ledger | `/api/v1/students/me/fees` | `GET` | `FEE_VIEW_OWN` | `StudentFee`, `FeePayment` | **Implemented & Verified** | `fee-math.spec.ts` |
| **Student** | Online Fee Payment Initiation | `/api/v1/fees/:id/payments` | `POST` | `FEE_PAY` | `FeePayment`, `StudentFee` | **Partially Implemented (Sandbox)** | `fee-math.spec.ts` |
| **Student** | Scholarship Matching | `/api/v1/scholarships`, `/matches` | `GET` | `SCHOLARSHIP_VIEW` | `Scholarship`, `Student` | **Implemented & Verified** | `eligibility.spec.ts` |
| **Student** | Placement Drives & Criteria | `/api/v1/placements/jobs` | `GET` | `PLACEMENT_VIEW` | `JobPosting`, `PlacementDrive` | **Implemented & Verified** | `matching.spec.ts` |
| **Student** | Grievance Ticket Creation | `/api/v1/complaints` | `POST` | `COMPLAINT_CREATE` | `Complaint` | **Implemented & Verified** | `workflow.spec.ts`, `complaint-draft.spec.ts` |
| **Student** | My Grievance Status | `/api/v1/complaints/my` | `GET` | `COMPLAINT_VIEW_OWN` | `Complaint` | **Implemented & Verified** | `workflow.spec.ts` |
| **Campus** | Institutional Circulars & Notices | `/api/v1/campus/notices` | `GET` | `NOTICE_VIEW` | `Notice` | **Implemented & Verified** | `campus.service` |
| **Campus** | Authorized Policy Documents | `/api/v1/documents` | `GET` | `DOCUMENT_VIEW` | `Document` (Role-partitioned) | **Implemented & Verified** | `visibility.spec.ts` |
| **Notifications** | Notification Feed | `/api/v1/notifications` | `GET` | `NOTIFICATION_VIEW` | `Notification` | **Implemented & Verified** | `notification-policy.spec.ts` |
| **Teacher** | Assigned Courses & Sections | `/api/v1/subject-offerings` | `GET` | `ORG_VIEW` | `SubjectOffering`, `Teacher` | **Implemented & Verified** | `teachers.service` |
| **Teacher** | Class Student Roster | `/api/v1/subject-offerings/:id/students` | `GET` | `STUDENT_VIEW` | `Enrollment`, `Student` | **Implemented & Verified** | `teachers.service` |
| **Teacher** | Mark Daily/Lecture Attendance | `/api/v1/attendance` | `POST` | `ATTENDANCE_MARK` | `Attendance`, `AttendanceSession` | **Implemented & Verified** | `attendance.service.spec.ts` |
| **Teacher** | Attendance Shortage Monitor | `/api/v1/attendance/analytics/shortage`| `GET` | `ATTENDANCE_VIEW` | `Attendance`, `Student` | **Implemented & Verified** | `attendance-math.spec.ts` |
| **HOD** | Department Analytics Overview | `/api/v1/analytics/overview` | `GET` | `ANALYTICS_VIEW` | `Student`, `Attendance`, `ExamResult` | **Implemented & Verified** | `analytics.service` |
| **HOD** | Department Faculty Roster | `/api/v1/teachers` | `GET` | `TEACHER_VIEW` | `Teacher`, `Department` | **Implemented & Verified** | `teachers.service` |
| **HOD** | Attendance Correction Approvals | `/api/v1/attendance/corrections` | `GET` | `ATTENDANCE_VIEW` | `AttendanceCorrection` | **Implemented & Verified** | `attendance.service.spec.ts` |
| **HOD** | Approve / Reject Correction | `/api/v1/attendance/corrections/:id/review` | `POST` | `ATTENDANCE_CORRECT_APPROVE` | `AttendanceCorrection`, `AuditLog` | **Implemented & Verified** | `attendance.service.spec.ts` |
| **Admin** | Quantified Attention Hub | `/api/v1/analytics/attention` | `GET` | `ANALYTICS_VIEW` | Multimodel scan (Shortage, Overdue, SLA) | **Implemented & Verified** | `analytics.service` |
| **Admin** | Executive Cross-Dept Analytics | `/api/v1/analytics/departments` | `GET` | `ANALYTICS_VIEW` | `Department`, `Attendance`, `Student` | **Implemented & Verified** | `analytics.service` |
| **Admin** | Institutional User Management | `/api/v1/users` | `GET`, `POST` | `USER_MANAGE` | `User`, `UserRole` | **Implemented & Verified** | `users.service` |
| **Admin** | Timetable Clash Detection | `/api/v1/timetable/check` | `POST` | `TIMETABLE_MANAGE` | `TimetableSlot`, `Room`, `Teacher` | **Implemented & Verified** | `conflicts.spec.ts` |
| **AI** | Grounded Supervisor Chat | `/api/v1/ai/chat` | `POST` | `AI_CHAT_ACCESS` | `DocumentChunk` (vector), Tools | **Implemented & Verified** | `rag.spec.ts`, `tool-registry.spec.ts`, `ai.test.ts` |
| **AI** | Personalized Academic Advisor | `/api/v1/ai/advisor` | `GET` | `AI_CHAT_ACCESS` | `Student`, `Attendance`, `ExamResult` | **Implemented & Verified** | `study-plan.spec.ts` |
| **AI** | AI System Observability | `/api/v1/ai/admin/usage` | `GET` | `AI_ADMIN` | Telemetry logs, token counters | **Implemented & Verified** | `ai.admin.service` |
| **Realtime** | Authenticated Live WebSocket | `/realtime` | WS / Socket.IO | Valid JWT | Live notification bus | **Implemented & Verified** | `realtime.gateway` |
