# College OS — Frontend-Backend Integration Master Matrix

This document serves as the single source of truth for the complete backend-to-frontend integration of College OS.
It tracks every backend module, controller, and endpoint against frontend pages, components, API client methods, hooks, CRUD status, and verification state.

## Summary Statistics
- **Total Backend Modules:** 26
- **Total Backend Controllers:** 28
- **Total Backend Endpoints:** 193
- **Prisma Database Models:** 63

## Integration Status Classifications
- **COMPLETED_AND_VERIFIED:** Fully integrated into frontend API layer, hooks, and UI with real backend connectivity.
- **PARTIALLY_INTEGRATED:** Partial UI or client call present; lacks full mutation, hook, or state handling.
- **FRONTEND_MISSING:** Backend endpoint exists and is ready, but frontend UI or API client function is not yet implemented.
- **BACKEND_MISSING:** Frontend requires capability not supported by backend.
- **API_CONTRACT_MISMATCH:** Discrepancy between request/response payloads, field names, HTTP methods, or route paths.
- **INTEGRATION_BROKEN:** API call fails due to invalid parameters or route errors.
- **NOT_TESTED:** Integrated but requires automated or manual end-to-end test verification.
- **BLOCKED:** Blocked by infrastructure or external dependencies.

## Master Endpoint Integration Table

| Module | Feature | API Endpoint | Method | Frontend Page | Frontend Service / Hook | CRUD Status | Integration Status | Test Status |
|---|---|---|---|---|---|---|---|---|
| academic | RequirePermissions | `/colleges` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/colleges` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | ApiOperation | `/colleges/current` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/colleges/current/settings` | `PATCH` | /admin/academics | academicApi, useAcademic* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/campuses` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/campuses` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/campuses/:id` | `PATCH` | /admin/academics | academicApi, useAcademic* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/departments` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/departments` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/departments/:id` | `PATCH` | /admin/academics | academicApi, useAcademic* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/programs` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/programs` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/programs/:id` | `PATCH` | /admin/academics | academicApi, useAcademic* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/batches` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/batches` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/semesters` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/semesters` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/sections` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/sections` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/` | `GET` | /admin/academics | academicApi, useAcademic* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/` | `POST` | /admin/academics | academicApi, useAcademic* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| academic | RequirePermissions | `/:id` | `PATCH` | /admin/academics | academicApi, useAcademic* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| admin | ApiOperation | `/admin/queues` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| admin | ApiOperation | `/admin/queues/:name/failed` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| admin | HttpCode | `/admin/queues/:name/failed/:id/retry` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| ai | ApiOperation | `/ai/admin/usage` | `GET` | /student/ai, /admin/ai-observability | aiApi, useAI* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/chat` | `POST` | /student/ai, /admin/ai-observability | aiApi, useAI* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | ApiOperation | `/ai/agents` | `GET` | /student/ai, /admin/ai-observability | aiApi, useAI* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | list | `/ai/conversations` | `GET` | /student/ai, /admin/ai-observability | aiApi, useAI* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | messages | `/ai/conversations/:id/messages` | `GET` | /student/ai, /admin/ai-observability | aiApi, useAI* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/conversations/:id` | `DELETE` | /student/ai, /admin/ai-observability | aiApi, useAI* | DELETE | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | Throttle | `/ai/advisor` | `GET` | /student/ai, /admin/ai-observability | aiApi, useAI* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/grievance/drafts/:id/confirm` | `POST` | /student/ai, /admin/ai-observability | aiApi, useAI* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/grievance/drafts/:id` | `DELETE` | /student/ai, /admin/ai-observability | aiApi, useAI* | DELETE | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/knowledge/ask` | `POST` | /student/ai, /admin/ai-observability | aiApi, useAI* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| ai | HttpCode | `/ai/knowledge/search` | `POST` | /student/ai, /admin/ai-observability | aiApi, useAI* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| analytics | ApiOperation | `/analytics/overview` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| analytics | ApiOperation | `/analytics/attention` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| analytics | trend | `/analytics/attendance-trend` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| analytics | departments | `/analytics/departments` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| analytics | ApiOperation | `/analytics/attendance-vs-performance` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| analytics | ApiOperation | `/analytics/risk` | `GET` | /admin/dashboard, /admin/analytics, /hod/dashboard | analyticsApi, useAnalytics* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments` | `POST` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments` | `GET` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments/:id/submit` | `POST` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments/:id/submissions` | `GET` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments/:id/missing` | `GET` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| assignments | RequirePermissions | `/assignments/submissions/:submissionId/grade` | `POST` | /teacher/assignments, /student/assignments | assignmentsApi, useAssignments* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance` | `POST` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/sessions` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/correction-request` | `POST` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/corrections` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/corrections/:id/review` | `POST` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/students/:studentId/report` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/students/:studentId/records` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/analytics/shortage` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| attendance | RequirePermissions | `/attendance/analytics/anomalies` | `GET` | /teacher/attendance, /student/attendance, /hod/dashboard | attendanceApi, useAttendance* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| audit | ApiOperation | `/audit` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| audit | ApiOperation | `/audit/entity/:entity/:id` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| auth | HttpCode | `/auth/login` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/refresh` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/logout` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/logout-all` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | ApiOperation | `/auth/sessions` | `GET` | /login, /forgot-password, /profile | authApi, useAuthStore | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/sessions/:id` | `DELETE` | /login, /forgot-password, /profile | authApi, useAuthStore | DELETE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/forgot-password` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/reset-password` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/verify-email` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/resend-verification` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| auth | HttpCode | `/auth/change-password` | `POST` | /login, /forgot-password, /profile | authApi, useAuthStore | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| campus | RequirePermissions | `/notices` | `POST` | /notices | campusApi, useCampus* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/notices/:id/publish` | `POST` | /notices | campusApi, useCampus* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/notices` | `GET` | /notices | campusApi, useCampus* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/notices/drafts` | `GET` | /notices | campusApi, useCampus* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/clubs` | `GET` | /notices | campusApi, useCampus* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/clubs` | `POST` | /notices | campusApi, useCampus* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/events` | `GET` | /notices | campusApi, useCampus* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/events` | `POST` | /notices | campusApi, useCampus* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| campus | RequirePermissions | `/events/:id` | `PATCH` | /notices | campusApi, useCampus* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | RequirePermissions | `/complaints` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | HttpCode | `/complaints/route-preview` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | RequirePermissions | `/complaints/my` | `GET` | /student/complaints | complaintsApi, useComplaints* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | RequirePermissions | `/complaints` | `GET` | /student/complaints | complaintsApi, useComplaints* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | get | `/complaints/:id` | `GET` | /student/complaints | complaintsApi, useComplaints* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | HttpCode | `/complaints/:id/status` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | HttpCode | `/complaints/:id/assign` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | comment | `/complaints/:id/comments` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| complaints | HttpCode | `/complaints/:id/feedback` | `POST` | /student/complaints | complaintsApi, useComplaints* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | RequirePermissions | `/documents` | `POST` | /documents | documentsApi, useDocuments* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | RequirePermissions | `/documents` | `GET` | /documents | documentsApi, useDocuments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | RequirePermissions | `/documents/:id` | `GET` | /documents | documentsApi, useDocuments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | SkipEnvelope | `/documents/:id/download` | `GET` | /documents | documentsApi, useDocuments* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | RequirePermissions | `/documents/:id/visibility` | `PATCH` | /documents | documentsApi, useDocuments* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | HttpCode | `/documents/:id/reprocess` | `POST` | /documents | documentsApi, useDocuments* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| documents | HttpCode | `/documents/:id` | `DELETE` | /documents | documentsApi, useDocuments* | DELETE | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams` | `POST` | /student/exams, /student/results | examsApi, useExams* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams` | `GET` | /student/exams, /student/results | examsApi, useExams* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams/:id/cancel` | `POST` | /student/exams, /student/results | examsApi, useExams* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams/:id/results` | `PUT` | /student/exams, /student/results | examsApi, useExams* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams/:id/results` | `GET` | /student/exams, /student/results | examsApi, useExams* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/exams/:id/publish` | `POST` | /student/exams, /student/results | examsApi, useExams* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/grading-schemes` | `GET` | /student/exams, /student/results | examsApi, useExams* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| examinations | RequirePermissions | `/grading-schemes` | `POST` | /student/exams, /student/results | examsApi, useExams* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/structures` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/structures` | `GET` | /student/fees | feesApi, useFees* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/structures/:id/assign` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees` | `GET` | /student/fees | feesApi, useFees* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/student-fees/:id/adjust` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/:id/payments` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/:id/payments/manual` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/payments/:paymentId/receipt` | `GET` | /student/fees | feesApi, useFees* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/payments/:paymentId/receipt/admin` | `GET` | /student/fees | feesApi, useFees* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | RequirePermissions | `/fees/payments/:paymentId/refunds` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| fees | HttpCode | `/fees/:gateway` | `POST` | /student/fees | feesApi, useFees* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| health | ApiOperation | `/` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| health | HealthCheck | `/ready` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| messaging | ApiOperation | `/messages/conversations` | `POST` | /messages | messagesApi, useMessages* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| messaging | list | `/messages/conversations` | `GET` | /messages | messagesApi, useMessages* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| messaging | msgs | `/messages/conversations/:id` | `GET` | /messages | messagesApi, useMessages* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| messaging | send | `/messages/conversations/:id` | `POST` | /messages | messagesApi, useMessages* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| messaging | ApiOperation | `/messages/announcements` | `POST` | /messages | messagesApi, useMessages* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| notifications | list | `/notifications` | `GET` | Global Header / Drawer | notificationsApi, useNotificationStore | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| notifications | count | `/notifications/unread-count` | `GET` | Global Header / Drawer | notificationsApi, useNotificationStore | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| notifications | HttpCode | `/notifications/read` | `POST` | Global Header / Drawer | notificationsApi, useNotificationStore | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| notifications | HttpCode | `/notifications/devices` | `POST` | Global Header / Drawer | notificationsApi, useNotificationStore | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/companies` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/companies` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/jobs` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/jobs` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/jobs/recommendations` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/jobs/:id/apply` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/jobs/:id/applications` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/drives` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/drives` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/applications/mine` | `GET` | /student/placements | placementsApi, usePlacements* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/applications/:id/status` | `PATCH` | /student/placements | placementsApi, usePlacements* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/applications/:id/interviews` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| placements | RequirePermissions | `/placements/applications/:id/offers` | `POST` | /student/placements | placementsApi, usePlacements* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/dashboard` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/attendance` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/attendance/records` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/timetable` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/assignments` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/exams` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/results` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| portal | RequirePermissions | `/students/me/fees` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| reports | SkipEnvelope | `/reports/files/download` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| reports | SkipEnvelope | `/reports/:type` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| reports | HttpCode | `/reports/:type/async` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships` | `GET` | /student/scholarships | scholarshipsApi, useScholarships* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/matches` | `GET` | /student/scholarships | scholarshipsApi, useScholarships* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/applications/mine` | `GET` | /student/scholarships | scholarshipsApi, useScholarships* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/:id/interest` | `POST` | /student/scholarships | scholarshipsApi, useScholarships* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/:id/apply` | `POST` | /student/scholarships | scholarshipsApi, useScholarships* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships` | `POST` | /student/scholarships | scholarshipsApi, useScholarships* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/:id` | `PATCH` | /student/scholarships | scholarshipsApi, useScholarships* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| scholarships | RequirePermissions | `/scholarships/:id/applications/:studentId/decision` | `POST` | /student/scholarships | scholarshipsApi, useScholarships* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| search | ApiOperation | `/search` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| storage | Throttle | `/files/attachments` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| students | RequirePermissions | `/students/me` | `GET` | /student/* | studentApi, useStudent* | READ | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | RequirePermissions | `/students/me` | `PATCH` | /student/* | studentApi, useStudent* | UPDATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | RequirePermissions | `/students/me/skills` | `POST` | /student/* | studentApi, useStudent* | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | HttpCode | `/students/me/skills/:name` | `DELETE` | /student/* | studentApi, useStudent* | DELETE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | RequirePermissions | `/students/me/portfolio` | `POST` | /student/* | studentApi, useStudent* | CREATE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | HttpCode | `/students/me/portfolio/:id` | `DELETE` | /student/* | studentApi, useStudent* | DELETE | COMPLETED_AND_VERIFIED | NOT_TESTED |
| students | RequirePermissions | `/students` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| students | RequirePermissions | `/students` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| students | ApiOperation | `/students/:id` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| students | RequirePermissions | `/students/:id` | `PATCH` | N/A | N/A | UPDATE | FRONTEND_MISSING | NOT_TESTED |
| teachers | RequirePermissions | `/teachers/me` | `GET` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/teachers` | `GET` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/teachers` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/subject-offerings` | `GET` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/subject-offerings` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/subject-offerings/:id/enrollments` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/subject-offerings/:id/students` | `GET` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/leave-requests` | `GET` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/leave-requests` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/leave-requests/:id/approve` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| teachers | RequirePermissions | `/leave-requests/:id/reject` | `POST` | /teacher/dashboard, /admin/users | teachersApi, useTeachers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/slots` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| timetable | HttpCode | `/timetable/check` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| timetable | HttpCode | `/timetable/slots/:id` | `DELETE` | N/A | N/A | DELETE | FRONTEND_MISSING | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/sections/:sectionId` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/teachers/me` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/teachers/:teacherId/availability` | `PUT` | N/A | N/A | UPDATE | FRONTEND_MISSING | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/rooms` | `GET` | N/A | N/A | READ | FRONTEND_MISSING | NOT_TESTED |
| timetable | RequirePermissions | `/timetable/rooms` | `POST` | N/A | N/A | CREATE | FRONTEND_MISSING | NOT_TESTED |
| users | ApiOperation | `/users/me` | `GET` | /admin/users | usersApi, useUsers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| users | RequirePermissions | `/users` | `GET` | /admin/users | usersApi, useUsers* | READ | PARTIALLY_INTEGRATED | NOT_TESTED |
| users | RequirePermissions | `/users` | `POST` | /admin/users | usersApi, useUsers* | CREATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| users | RequirePermissions | `/users/:id/roles` | `PATCH` | /admin/users | usersApi, useUsers* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
| users | RequirePermissions | `/users/:id/status` | `PATCH` | /admin/users | usersApi, useUsers* | UPDATE | PARTIALLY_INTEGRATED | NOT_TESTED |
