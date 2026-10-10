# API reference

> Generated from the live route table (`npm run docs:api`). Interactive docs: `/docs` (Swagger, non-production).

All routes are under `/api/v1` (health probes excluded). Responses use the envelope `{ success, data, meta?, timestamp, requestId }`; errors use `{ success:false, statusCode, message, errorCode, timestamp, requestId }`.
Auth: `Authorization: Bearer <access token>`. "authenticated" means any logged-in user (row-level scope still applies).

**192 endpoints**


## Admin

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/admin/queues` | `ORG_MANAGE` |
| GET | `/api/v1/admin/queues/:name/failed` | `ORG_MANAGE` |
| POST | `/api/v1/admin/queues/:name/failed/:id/retry` | `ORG_MANAGE` |

## AiAdmin

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/ai/admin/usage` | `AI_ADMIN` |

## Analytics

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/analytics/attendance-trend` | `ANALYTICS_VIEW` |
| GET | `/api/v1/analytics/attendance-vs-performance` | `ANALYTICS_VIEW` |
| GET | `/api/v1/analytics/attention` | `ANALYTICS_VIEW` |
| GET | `/api/v1/analytics/departments` | `ANALYTICS_VIEW` |
| GET | `/api/v1/analytics/overview` | `ANALYTICS_VIEW` |
| GET | `/api/v1/analytics/risk` | `ANALYTICS_VIEW` |

## Assignments

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/assignments` | `ASSIGNMENT_VIEW` |
| POST | `/api/v1/assignments` | `ASSIGNMENT_MANAGE` |
| GET | `/api/v1/assignments/:id/missing` | `ASSIGNMENT_MANAGE` |
| GET | `/api/v1/assignments/:id/submissions` | `ASSIGNMENT_MANAGE` |
| POST | `/api/v1/assignments/:id/submit` | `ASSIGNMENT_SUBMIT` |
| POST | `/api/v1/assignments/submissions/:submissionId/grade` | `ASSIGNMENT_MANAGE` |

## Attendance

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/attendance` | `ATTENDANCE_MARK` |
| GET | `/api/v1/attendance/analytics/anomalies` | `ATTENDANCE_CORRECT_APPROVE` |
| GET | `/api/v1/attendance/analytics/shortage` | `ATTENDANCE_VIEW`, `ANALYTICS_VIEW` |
| POST | `/api/v1/attendance/correction-request` | `ATTENDANCE_CORRECT_REQUEST` |
| GET | `/api/v1/attendance/corrections` | `ATTENDANCE_VIEW` |
| POST | `/api/v1/attendance/corrections/:id/review` | `ATTENDANCE_CORRECT_APPROVE` |
| GET | `/api/v1/attendance/sessions` | `ATTENDANCE_VIEW` |
| GET | `/api/v1/attendance/students/:studentId/records` | `ATTENDANCE_VIEW` |
| GET | `/api/v1/attendance/students/:studentId/report` | `ATTENDANCE_VIEW` |

## Audit

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/audit` | `AUDIT_VIEW` |
| GET | `/api/v1/audit/entity/:entity/:id` | `AUDIT_VIEW` |

## Auth

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/auth/change-password` | authenticated |
| POST | `/api/v1/auth/forgot-password` | public |
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/logout` | authenticated |
| POST | `/api/v1/auth/logout-all` | authenticated |
| POST | `/api/v1/auth/refresh` | public |
| POST | `/api/v1/auth/resend-verification` | authenticated |
| POST | `/api/v1/auth/reset-password` | public |
| GET | `/api/v1/auth/sessions` | authenticated |
| DELETE | `/api/v1/auth/sessions/:id` | authenticated |
| POST | `/api/v1/auth/verify-email` | public |

## Batch

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/batches` | `ORG_VIEW` |
| POST | `/api/v1/batches` | `ORG_MANAGE` |
| GET | `/api/v1/sections` | `ORG_VIEW` |
| POST | `/api/v1/sections` | `ORG_MANAGE` |
| GET | `/api/v1/semesters` | `ORG_VIEW` |
| POST | `/api/v1/semesters` | `ORG_MANAGE` |

## Campus

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/clubs` | `EVENT_VIEW` |
| POST | `/api/v1/clubs` | `EVENT_MANAGE` |
| GET | `/api/v1/events` | `EVENT_VIEW` |
| POST | `/api/v1/events` | `EVENT_MANAGE` |
| PATCH | `/api/v1/events/:id` | `EVENT_MANAGE` |
| GET | `/api/v1/notices` | `NOTICE_VIEW` |
| POST | `/api/v1/notices` | `NOTICE_CREATE` |
| POST | `/api/v1/notices/:id/publish` | `NOTICE_PUBLISH` |
| GET | `/api/v1/notices/drafts` | `NOTICE_CREATE` |

## Chat

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/ai/advisor` | `AI_CHAT` |
| GET | `/api/v1/ai/agents` | `AI_CHAT` |
| POST | `/api/v1/ai/chat` | `AI_CHAT` |
| GET | `/api/v1/ai/conversations` | `AI_CHAT` |
| DELETE | `/api/v1/ai/conversations/:id` | `AI_CHAT` |
| GET | `/api/v1/ai/conversations/:id/messages` | `AI_CHAT` |
| DELETE | `/api/v1/ai/grievance/drafts/:id` | `COMPLAINT_CREATE` |
| POST | `/api/v1/ai/grievance/drafts/:id/confirm` | `COMPLAINT_CREATE` |

## Complaints

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/complaints` | `COMPLAINT_MANAGE` |
| POST | `/api/v1/complaints` | `COMPLAINT_CREATE` |
| GET | `/api/v1/complaints/:id` | authenticated |
| POST | `/api/v1/complaints/:id/assign` | `COMPLAINT_MANAGE` |
| POST | `/api/v1/complaints/:id/comments` | authenticated |
| POST | `/api/v1/complaints/:id/feedback` | `COMPLAINT_VIEW_OWN` |
| POST | `/api/v1/complaints/:id/status` | `COMPLAINT_MANAGE` |
| GET | `/api/v1/complaints/my` | `COMPLAINT_VIEW_OWN` |
| POST | `/api/v1/complaints/route-preview` | `COMPLAINT_CREATE` |

## Documents

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/documents` | `DOCUMENT_VIEW` |
| POST | `/api/v1/documents` | `DOCUMENT_UPLOAD` |
| DELETE | `/api/v1/documents/:id` | `DOCUMENT_DELETE` |
| GET | `/api/v1/documents/:id` | `DOCUMENT_VIEW` |
| GET | `/api/v1/documents/:id/download` | `DOCUMENT_VIEW` |
| POST | `/api/v1/documents/:id/reprocess` | `DOCUMENT_UPLOAD` |
| PATCH | `/api/v1/documents/:id/visibility` | `DOCUMENT_UPLOAD` |

## Examinations

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/exams` | `EXAM_VIEW` |
| POST | `/api/v1/exams` | `EXAM_MANAGE` |
| POST | `/api/v1/exams/:id/cancel` | `EXAM_MANAGE` |
| POST | `/api/v1/exams/:id/publish` | `RESULT_PUBLISH` |
| GET | `/api/v1/exams/:id/results` | `RESULT_CREATE` |
| PUT | `/api/v1/exams/:id/results` | `RESULT_CREATE` |
| GET | `/api/v1/grading-schemes` | `EXAM_VIEW` |
| POST | `/api/v1/grading-schemes` | `EXAM_MANAGE` |

## Fees

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/fees` | `FEE_VIEW_ALL` |
| POST | `/api/v1/fees/:id/payments` | `FEE_VIEW_OWN` |
| POST | `/api/v1/fees/:id/payments/manual` | `PAYMENT_CREATE` |
| GET | `/api/v1/fees/payments/:paymentId/receipt` | `FEE_VIEW_OWN` |
| GET | `/api/v1/fees/payments/:paymentId/receipt/admin` | `FEE_VIEW_ALL` |
| POST | `/api/v1/fees/payments/:paymentId/refunds` | `REFUND_MANAGE` |
| GET | `/api/v1/fees/structures` | `FEE_VIEW_ALL` |
| POST | `/api/v1/fees/structures` | `FEE_MANAGE` |
| POST | `/api/v1/fees/structures/:id/assign` | `FEE_MANAGE` |
| POST | `/api/v1/fees/student-fees/:id/adjust` | `FEE_MANAGE` |

## Health

| Method | Path | Access |
|---|---|---|
| GET | `/health` | public |
| GET | `/health/ready` | public |

## Messaging

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/messages/announcements` | `MESSAGE_SEND` |
| GET | `/api/v1/messages/conversations` | `MESSAGE_SEND` |
| POST | `/api/v1/messages/conversations` | `MESSAGE_SEND` |
| GET | `/api/v1/messages/conversations/:id` | `MESSAGE_SEND` |
| POST | `/api/v1/messages/conversations/:id` | `MESSAGE_SEND` |

## Notifications

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/notifications` | authenticated |
| POST | `/api/v1/notifications/devices` | authenticated |
| POST | `/api/v1/notifications/read` | authenticated |
| GET | `/api/v1/notifications/unread-count` | authenticated |

## Org

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/campuses` | `ORG_VIEW` |
| POST | `/api/v1/campuses` | `ORG_MANAGE` |
| PATCH | `/api/v1/campuses/:id` | `ORG_MANAGE` |
| GET | `/api/v1/colleges` | `ORG_MANAGE` |
| POST | `/api/v1/colleges` | `ORG_MANAGE` |
| GET | `/api/v1/colleges/current` | authenticated |
| PATCH | `/api/v1/colleges/current/settings` | `ORG_MANAGE` |
| GET | `/api/v1/departments` | `ORG_VIEW` |
| POST | `/api/v1/departments` | `ORG_MANAGE` |
| PATCH | `/api/v1/departments/:id` | `ORG_MANAGE` |
| GET | `/api/v1/programs` | `ORG_VIEW` |
| POST | `/api/v1/programs` | `ORG_MANAGE` |
| PATCH | `/api/v1/programs/:id` | `ORG_MANAGE` |

## PaymentWebhook

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/webhooks/payments/:gateway` | public |

## Placements

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/placements/applications/:id/interviews` | `PLACEMENT_MANAGE` |
| POST | `/api/v1/placements/applications/:id/offers` | `PLACEMENT_MANAGE` |
| PATCH | `/api/v1/placements/applications/:id/status` | `PLACEMENT_MANAGE` |
| GET | `/api/v1/placements/applications/mine` | `PLACEMENT_APPLY` |
| GET | `/api/v1/placements/companies` | `PLACEMENT_VIEW` |
| POST | `/api/v1/placements/companies` | `PLACEMENT_MANAGE` |
| GET | `/api/v1/placements/drives` | `PLACEMENT_VIEW` |
| POST | `/api/v1/placements/drives` | `PLACEMENT_MANAGE` |
| GET | `/api/v1/placements/jobs` | `PLACEMENT_VIEW` |
| POST | `/api/v1/placements/jobs` | `PLACEMENT_MANAGE` |
| GET | `/api/v1/placements/jobs/:id/applications` | `PLACEMENT_MANAGE` |
| POST | `/api/v1/placements/jobs/:id/apply` | `PLACEMENT_APPLY` |
| GET | `/api/v1/placements/jobs/recommendations` | `PLACEMENT_APPLY` |

## Portal

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/students/me/assignments` | `ASSIGNMENT_VIEW` |
| GET | `/api/v1/students/me/attendance` | `ATTENDANCE_VIEW_OWN` |
| GET | `/api/v1/students/me/attendance/records` | `ATTENDANCE_VIEW_OWN` |
| GET | `/api/v1/students/me/dashboard` | `STUDENT_VIEW_OWN` |
| GET | `/api/v1/students/me/exams` | `EXAM_VIEW` |
| GET | `/api/v1/students/me/fees` | `FEE_VIEW_OWN` |
| GET | `/api/v1/students/me/results` | `RESULT_VIEW_OWN` |
| GET | `/api/v1/students/me/timetable` | `TIMETABLE_VIEW` |

## Rag

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/ai/knowledge/ask` | `AI_CHAT` |
| POST | `/api/v1/ai/knowledge/search` | `AI_CHAT` |

## Reports

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/reports/:type` | `REPORT_EXPORT` |
| POST | `/api/v1/reports/:type/async` | `REPORT_EXPORT` |
| GET | `/api/v1/reports/files/download` | `REPORT_EXPORT` |

## Scholarships

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/scholarships` | `SCHOLARSHIP_VIEW` |
| POST | `/api/v1/scholarships` | `SCHOLARSHIP_MANAGE` |
| PATCH | `/api/v1/scholarships/:id` | `SCHOLARSHIP_MANAGE` |
| POST | `/api/v1/scholarships/:id/applications/:studentId/decision` | `SCHOLARSHIP_MANAGE` |
| POST | `/api/v1/scholarships/:id/apply` | `SCHOLARSHIP_VIEW` |
| POST | `/api/v1/scholarships/:id/interest` | `SCHOLARSHIP_VIEW` |
| GET | `/api/v1/scholarships/applications/mine` | `SCHOLARSHIP_VIEW` |
| GET | `/api/v1/scholarships/matches` | `SCHOLARSHIP_VIEW` |

## Search

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/search` | `SEARCH` |

## Storage

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/files/attachments` | authenticated |

## Students

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/students` | `STUDENT_VIEW` |
| POST | `/api/v1/students` | `STUDENT_MANAGE` |
| GET | `/api/v1/students/:id` | authenticated |
| PATCH | `/api/v1/students/:id` | `STUDENT_MANAGE` |
| GET | `/api/v1/students/me` | `STUDENT_VIEW_OWN` |
| PATCH | `/api/v1/students/me` | `STUDENT_VIEW_OWN` |
| POST | `/api/v1/students/me/portfolio` | `STUDENT_VIEW_OWN` |
| DELETE | `/api/v1/students/me/portfolio/:id` | `STUDENT_VIEW_OWN` |
| POST | `/api/v1/students/me/skills` | `STUDENT_VIEW_OWN` |
| DELETE | `/api/v1/students/me/skills/:name` | `STUDENT_VIEW_OWN` |

## Subject

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/subjects` | `ORG_VIEW` |
| POST | `/api/v1/subjects` | `ORG_MANAGE` |
| PATCH | `/api/v1/subjects/:id` | `ORG_MANAGE` |

## Teachers

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/leave-requests` | `LEAVE_REQUEST` |
| POST | `/api/v1/leave-requests/:id/approve` | `LEAVE_APPROVE` |
| POST | `/api/v1/leave-requests/:id/reject` | `LEAVE_APPROVE` |
| GET | `/api/v1/subject-offerings` | `ORG_VIEW` |
| POST | `/api/v1/subject-offerings` | `ORG_MANAGE` |
| POST | `/api/v1/subject-offerings/:id/enrollments` | `ORG_MANAGE` |
| GET | `/api/v1/subject-offerings/:id/students` | `STUDENT_VIEW` |
| GET | `/api/v1/teachers` | `TEACHER_VIEW` |
| POST | `/api/v1/teachers` | `TEACHER_MANAGE` |
| GET | `/api/v1/teachers/me` | `TEACHER_VIEW` |

## Timetable

| Method | Path | Access |
|---|---|---|
| POST | `/api/v1/timetable/check` | `TIMETABLE_MANAGE` |
| GET | `/api/v1/timetable/rooms` | `TIMETABLE_VIEW` |
| POST | `/api/v1/timetable/rooms` | `TIMETABLE_MANAGE` |
| GET | `/api/v1/timetable/sections/:sectionId` | `TIMETABLE_VIEW` |
| POST | `/api/v1/timetable/slots` | `TIMETABLE_MANAGE` |
| DELETE | `/api/v1/timetable/slots/:id` | `TIMETABLE_MANAGE` |
| PUT | `/api/v1/timetable/teachers/:teacherId/availability` | `TIMETABLE_MANAGE` |
| GET | `/api/v1/timetable/teachers/me` | `TIMETABLE_VIEW` |

## Users

| Method | Path | Access |
|---|---|---|
| GET | `/api/v1/users` | `USER_MANAGE` |
| POST | `/api/v1/users` | `USER_MANAGE` |
| PATCH | `/api/v1/users/:id/roles` | `USER_MANAGE` |
| PATCH | `/api/v1/users/:id/status` | `USER_MANAGE` |
| GET | `/api/v1/users/me` | authenticated |
