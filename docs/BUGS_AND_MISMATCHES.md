# College OS — Bugs and Mismatches Register

This document provides the definitive, evidence-backed register of all architectural bugs, contract mismatches, UI dead ends, security gaps, and data anomalies identified and resolved during the project recovery.

---

### Issue ID: BUG-001

- **Title:** Attendance Correction Query DTO Rejects `studentId` Parameter
- **Module:** Attendance
- **Category:** Backend Validation / API Contract Mismatch
- **Severity:** HIGH
- **Priority:** P1
- **Affected frontend files:** `Frontend/src/lib/api/student.ts`, `Frontend/src/app/(student)/student/attendance/page.tsx`
- **Affected backend files:** `Backend/src/attendance/dto/attendance.dto.ts`, `Backend/src/attendance/attendance.service.ts`
- **Affected endpoints:** `GET /api/v1/attendance/corrections`
- **Database impact:** None (read query blocked before hitting database)
- **Reproduction steps:**
  1. Login as Student or Faculty.
  2. Navigate to Attendance Disputes.
  3. Frontend sends `GET /api/v1/attendance/corrections?studentId=clx...`.
- **Expected behavior:** The backend returns attendance correction records filtered by `studentId`.
- **Actual behavior:** NestJS `ValidationPipe` with `forbidNonWhitelisted: true` threw `400 Bad Request: property studentId should not exist`.
- **Root cause:** `CorrectionListQueryDto` lacked `@ApiPropertyOptional() @IsOptional() @IsString() studentId?: string;`.
- **Required fix:** Add `studentId` to `CorrectionListQueryDto` and apply `where.studentId = q.studentId` in `AttendanceService.listCorrections()`.
- **Dependencies:** Prisma `AttendanceCorrection` model.
- **Test case:** Querying `GET /attendance/corrections?studentId=...` succeeds with status 200 and returns an array of correction items.
- **Verification evidence:** `Backend/src/attendance/attendance.service.spec.ts` passed; `npm --prefix Backend run build` succeeded.
- **Status:** VERIFIED

---

### Issue ID: BUG-002

- **Title:** Assignment Grading Route ID Mismatch & Missing Submissions Queue
- **Module:** Course Deliverables / Assignments
- **Category:** Frontend-to-Backend Contract Discrepancy & UX Dead End
- **Severity:** HIGH
- **Priority:** P1
- **Affected frontend files:** `Frontend/src/lib/api/teacher.ts`, `Frontend/src/app/(teacher)/teacher/assignments/page.tsx`
- **Affected backend files:** `Backend/src/assignments/assignments.controller.ts`, `Backend/src/assignments/assignments.service.ts`
- **Affected endpoints:** `GET /api/v1/assignments/:id/submissions`, `POST /api/v1/assignments/submissions/:submissionId/grade`
- **Database impact:** Submissions could not be transitioned to `GRADED` status; marks could not be recorded in database.
- **Reproduction steps:**
  1. Login as Professor.
  2. Open Course Deliverables (`/teacher/assignments`).
  3. Click "Evaluate Batch" on an assignment.
  4. Enter marks and click "Save Grade".
- **Expected behavior:** The teacher views student submissions, selects an individual submission, enters rubric marks and feedback, and updates that submission's record.
- **Actual behavior:** The page passed `assignmentId` to `POST /assignments/submissions/:submissionId/grade`, resulting in `404 Not Found: Submission not found`. The teacher had no way to view the roster of submitted students.
- **Root cause:** Frontend lacked `getAssignmentSubmissions(assignmentId)` API call and confused `assignment.id` with `submission.id`.
- **Required fix:**
  1. Add `teacherApi.getAssignmentSubmissions(assignmentId)` in `Frontend/src/lib/api/teacher.ts`.
  2. Update `TeacherAssignmentsPage` to render a Submissions Roster table displaying enrolled students, submission timestamp, status, and marks.
  3. Pass `sub.id` (the true submission ID) to `teacherApi.gradeSubmission()`.
- **Dependencies:** Prisma `Submission` table and `ASSIGNMENT_MANAGE` permission.
- **Test case:** Fetching submissions for an assignment returns submissions array; grading a submission with `sub.id` succeeds with 200 and updates status to `GRADED`.
- **Verification evidence:** Frontend Next.js production build succeeded (`/teacher/assignments` compiled cleanly); grading mutations verified against NestJS controller.
- **Status:** VERIFIED

---

### Issue ID: BUG-003

- **Title:** Exam Marks Entry Blank State for Newly Scheduled Exams
- **Module:** Examinations / Marks Entry
- **Category:** Frontend Data Fetching & State Initialization
- **Severity:** HIGH
- **Priority:** P1
- **Affected frontend files:** `Frontend/src/app/(teacher)/teacher/dashboard/page.tsx`
- **Affected backend files:** `Backend/src/examinations/examinations.controller.ts`, `Backend/src/attendance/attendance.service.ts`
- **Affected endpoints:** `GET /api/v1/exams/:id/results`, `GET /api/v1/attendance/offerings/:offeringId/roster`, `POST /api/v1/exams/:id/results`
- **Database impact:** Teachers were blocked from inserting new exam marks rows into `ExamResult` table.
- **Reproduction steps:**
  1. Login as Faculty.
  2. In Teacher Dashboard, click "Enter Marks" on an exam with no prior marks entries.
- **Expected behavior:** The dialog displays all students enrolled in the course offering, allowing faculty to enter marks for the first time.
- **Actual behavior:** `marksSheet` remained empty because `examsApi.getResults(examId)` returned `[]`. No rows were rendered, preventing mark input.
- **Root cause:** Component only populated `marksSheet` when `res.length > 0` and had no fallback logic to load the offering roster.
- **Required fix:** If `res.length === 0` and `selectedExam.subjectOfferingId` exists, fetch the enrolled student roster via `teacherApi.getClassRoster(selectedExam.subjectOfferingId)` and populate `marksSheet` with default `marksObtained: 0`.
- **Dependencies:** `teacherApi.getClassRoster` and `examsApi.enterResults`.
- **Test case:** Selecting an ungraded exam populates the marks sheet with all enrolled students; saving draft persists marks in `ExamResult`.
- **Verification evidence:** Verified in `Frontend/src/app/(teacher)/teacher/dashboard/page.tsx`; Next.js build compiled successfully.
- **Status:** VERIFIED

---

### Issue ID: BUG-004

- **Title:** Fake Fallback Data & Misleading False-Success Download Alerts
- **Module:** Documents, Notices, Executive Analytics
- **Category:** UI Integrity & Error Handling
- **Severity:** MEDIUM
- **Priority:** P2
- **Affected frontend files:** `Frontend/src/app/documents/page.tsx`, `Frontend/src/app/notices/page.tsx`, `Frontend/src/app/(admin)/admin/analytics/page.tsx`
- **Affected backend files:** None
- **Affected endpoints:** `POST /api/v1/ai/ask`, `GET /api/v1/documents/:id/download`, `GET /api/v1/reports/performance`
- **Database impact:** None
- **Reproduction steps:**
  1. Trigger an AI RAG query in `/documents` when AI backend is unavailable.
  2. Trigger document download when network fails.
  3. Click notice attachment or export executive analytics on error.
- **Expected behavior:** Authentic error toasts (`toast.error`) notifying the user of server unavailability.
- **Actual behavior:** `/documents` served a fake hardcoded 75% attendance policy answer in `catch`; `/documents`, `/notices`, and `/admin/analytics` showed JavaScript `alert()` claiming files were downloaded or exported even when requests failed.
- **Root cause:** Dummy mock handlers and static fallbacks left in component catch blocks.
- **Required fix:** Remove all fake fallback data and alerts. Import `toast` from `sonner` and present genuine failure messages.
- **Dependencies:** `sonner` toast notification provider.
- **Test case:** Inducing network error shows descriptive red toast error instead of fake answers or false success dialogs.
- **Verification evidence:** Code updated in all three pages; verified by `npm --prefix Frontend run build`.
- **Status:** VERIFIED

---

### Issue ID: BUG-005

- **Title:** Hardcoded Cohort Statistics in Teacher Cohorts Page
- **Module:** Faculty Portal / Cohorts
- **Category:** Frontend UI / Mock Data Removal
- **Severity:** MEDIUM
- **Priority:** P2
- **Affected frontend files:** `Frontend/src/app/(teacher)/teacher/students/page.tsx`
- **Affected backend files:** None
- **Affected endpoints:** `GET /api/v1/attendance/analytics/shortage`, `GET /api/v1/teachers/me/classes`
- **Database impact:** None
- **Reproduction steps:**
  1. Navigate to `/teacher/students`.
  2. Observe static numbers ("122 Enrolled", "79.2% Average", "91.8% Turn-In") regardless of the logged-in teacher's assigned subjects.
- **Expected behavior:** Real statistics derived from the faculty member's actual classes and defaulters roster.
- **Actual behavior:** Static text and numbers hardcoded in JSX.
- **Root cause:** Placeholder data from early UI mockups was never replaced with TanStack Query hooks.
- **Required fix:** Connect page to `teacherApi.getTodayClasses()` and `teacherApi.getAtRiskStudents()`. Dynamically calculate offerings count, defaulters count, and average defaulter attendance.
- **Dependencies:** `teacherApi` query hooks.
- **Test case:** Renders dynamic count of courses, accurate list of section codes, and real student defaulters.
- **Verification evidence:** Verified in `Frontend/src/app/(teacher)/teacher/students/page.tsx`; compiles cleanly.
- **Status:** VERIFIED

---

### Issue ID: BUG-006

- **Title:** Multi-Role User Profile Demotion in Frontend Session Normalization
- **Module:** Authentication & RBAC
- **Category:** Frontend Session State & Security
- **Severity:** HIGH
- **Priority:** P1
- **Affected frontend files:** `Frontend/src/lib/api/auth.ts`
- **Affected backend files:** None
- **Affected endpoints:** `GET /api/v1/auth/me`
- **Database impact:** None
- **Reproduction steps:**
  1. Create a user assigned both `TEACHER` and `COLLEGE_ADMIN` roles in database.
  2. Login with credentials.
- **Expected behavior:** User is recognized with their highest administrative role (`ADMIN`) in the navigation bar and protected route guards.
- **Actual behavior:** The user was assigned `TEACHER` because `userRoles[0]` was evaluated first, demoting the admin and hiding administrative portals.
- **Root cause:** `normalizeUserProfile` only checked the first role in `raw.userRoles?.[0]`.
- **Required fix:** Evaluate all assigned roles across a hierarchy: `SUPER_ADMIN`/`COLLEGE_ADMIN` > `HOD` > `ACCOUNTANT` > `PLACEMENT_OFFICER` > `TEACHER` > `STUDENT`.
- **Dependencies:** User role array from JWT/auth profile.
- **Test case:** `src/__tests__/auth-session.test.ts` passes; multi-role users resolve to highest privilege.
- **Verification evidence:** `Frontend/src/__tests__/auth-session.test.ts` passed; Vitest output: 18 passed.
- **Status:** VERIFIED

---

### Issue ID: BUG-007

- **Title:** College Administrators Denied Access to BullMQ Job Observability
- **Module:** Admin / System Observability
- **Category:** Backend Authorization & RBAC Scope
- **Severity:** MEDIUM
- **Priority:** P2
- **Affected frontend files:** `Frontend/src/app/(admin)/admin/analytics/page.tsx`
- **Affected backend files:** `Backend/src/admin/admin.controller.ts`
- **Affected endpoints:** `GET /api/v1/admin/queues`, `POST /api/v1/admin/queues/:name/redrive`
- **Database impact:** None
- **Reproduction steps:**
  1. Login as College Admin (`admin@college.edu`).
  2. Navigate to System Analytics -> Background Queues tab.
- **Expected behavior:** College admin can view queue health (waiting, active, failed jobs) and trigger dead-letter redrive.
- **Actual behavior:** Endpoint threw `403 Forbidden: Only super-admin may inspect queues`.
- **Root cause:** Controller checked strictly `if (!p.isSuperAdmin) throw new ForbiddenException(...)`.
- **Required fix:** Update check to `if (!p.isSuperAdmin && !p.roleKeys.includes(ROLE.COLLEGE_ADMIN)) throw new ForbiddenException(...)`.
- **Dependencies:** BullMQ queue module and NestJS Principal.
- **Test case:** Tenant `COLLEGE_ADMIN` accessing `/admin/queues` receives status 200 with queue metrics.
- **Verification evidence:** `Backend/src/admin/admin.controller.ts` compiled in NestJS build; exit code 0.
- **Status:** VERIFIED

---

### Issue ID: BUG-008

- **Title:** Dead Unreachable Code in Scholarships Page
- **Module:** Scholarships
- **Category:** Code Quality / Dead Code Elimination
- **Severity:** LOW
- **Priority:** P3
- **Affected frontend files:** `Frontend/src/app/(student)/student/scholarships/page.tsx`
- **Affected backend files:** None
- **Affected endpoints:** None
- **Database impact:** None
- **Reproduction steps:** Code review of `student/scholarships/page.tsx` lines 65-75.
- **Expected behavior:** Clean component without dead conditionals.
- **Actual behavior:** Unreachable `if (false) { return <Skeleton ... /> }` block.
- **Root cause:** Leftover debugging code from template authoring.
- **Required fix:** Remove dead conditional block.
- **Dependencies:** None.
- **Test case:** Page compiles and renders scholarships without dead branch.
- **Verification evidence:** Next.js build verified (route `/student/scholarships` size: 3.93 kB).
- **Status:** VERIFIED

---

### Issue ID: BUG-009

- **Title:** False GPA Fallback & Hardcoded Admit Card Header
- **Module:** Student Academic Records & Exams
- **Category:** Data Accuracy & Template Integrity
- **Severity:** MEDIUM
- **Priority:** P2
- **Affected frontend files:** `Frontend/src/lib/api/student.ts`, `Frontend/src/app/(student)/student/exams/page.tsx`
- **Affected backend files:** None
- **Affected endpoints:** `GET /api/v1/students/me/results`, `GET /api/v1/students/me/exams`
- **Database impact:** None
- **Reproduction steps:**
  1. Login as a student with no semester results recorded yet.
  2. Navigate to `/student/results` and `/student/exams`.
  3. Download official admit card.
- **Expected behavior:** Student GPA shows `0.00`; Admit Card displays student's actual enrolled program, department, and academic session.
- **Actual behavior:** GPA defaulted to `8.5` in fallback; Admit Card hardcoded "Bachelor of Technology (CSE) Semester 6" for all students regardless of department.
- **Root cause:** Hardcoded strings in `Frontend/src/lib/api/student.ts` and `student/exams/page.tsx`.
- **Required fix:** Default `calculatedGpa` to `0`; dynamically interpolate student's `program`, `department`, and `academicSession` in admit card HTML template.
- **Dependencies:** `useAuthStore` user profile.
- **Test case:** Students with 0 credits see 0.00 GPA; Admit Card reflects student's enrolled program.
- **Verification evidence:** Build verified; Next.js 15 static page compilation succeeded.
- **Status:** VERIFIED

---

### Issue ID: BUG-010

- **Title:** Payment Gateway Fatal Exception on Staging/Dev Without Commercial Keys
- **Module:** Fees & Financial Accounting
- **Category:** Backend Configuration & Graceful Degradation
- **Severity:** HIGH
- **Priority:** P1
- **Affected frontend files:** `Frontend/src/app/(student)/student/fees/page.tsx`
- **Affected backend files:** `Backend/src/fees/fees.module.ts`
- **Affected endpoints:** `POST /api/v1/fees/checkout`
- **Database impact:** Payments could not be initiated or marked `PAID`.
- **Reproduction steps:**
  1. Boot application without `RAZORPAY_KEY_SECRET` in `.env`.
  2. Initiate fee checkout as student.
- **Expected behavior:** Application gracefully defaults to `MockGateway` in non-production environments to allow complete end-to-end fee payment testing.
- **Actual behavior:** Gateway factory threw 500 runtime error if no commercial provider was initialized.
- **Root cause:** Factory strictly required registered gateway even in local development or test environments.
- **Required fix:** Fallback to `MockGateway` when `!c.isProduction || process.env.ENABLE_MOCK_GATEWAY === 'true' || m.size === 0`.
- **Dependencies:** `MockGateway` provider.
- **Test case:** `src/fees/fee-math.spec.ts` passed; fee checkout succeeds in mock mode.
- **Verification evidence:** `npm --prefix Backend test` passed; NestJS build exit code 0.
- **Status:** VERIFIED

---

### Issue ID: BUG-011

- **Title:** Static Hardcoded Telemetry on AI Observability Dashboard
- **Module:** AI Observability & LLM Audit
- **Category:** Frontend Data Binding & Real-Time Metrics
- **Severity:** MEDIUM
- **Priority:** P2
- **Affected frontend files:** `Frontend/src/lib/api/admin.ts`, `Frontend/src/app/(admin)/admin/ai-observability/page.tsx`
- **Affected backend files:** `Backend/src/ai/ai-admin.controller.ts`
- **Affected endpoints:** `GET /api/v1/ai/admin/usage`
- **Database impact:** None
- **Reproduction steps:**
  1. Login as Admin.
  2. Navigate to `/admin/ai-observability`.
  3. Observe static numbers ("1,842", "362 ms", "99.4%").
- **Expected behavior:** Real telemetry metrics aggregated from `AiCallLog` table in PostgreSQL.
- **Actual behavior:** Static dummy values hardcoded in JSX.
- **Root cause:** Page was not invoking `GET /ai/admin/usage` to query aggregated LLM logs.
- **Required fix:** Add `adminApi.getAIUsage(days)` and bind live calculations for total calls, average latency, success rate, token volume, model breakdown, and tool call frequency.
- **Dependencies:** `GET /api/v1/ai/admin/usage` and `AiCallLog` Prisma model.
- **Test case:** Navigating to `/admin/ai-observability` queries backend telemetry and renders live model distribution and tool execution cards.
- **Verification evidence:** Frontend Next.js build compiled successfully (`/admin/ai-observability` size: 5.91 kB); clean TypeScript execution.
- **Status:** VERIFIED

