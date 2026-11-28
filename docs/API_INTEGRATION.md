# API & Realtime Integration Specification

Defines the HTTP (`/api/v1`) and Socket.IO (`/realtime`) contracts between the **Next.js Frontend** and **NestJS Backend**.

- **REST Base URL:** `http://localhost:3000/api/v1` (`NEXT_PUBLIC_API_URL`)
- **Swagger UI (non-production):** `http://localhost:3000/docs`
- **Generated Route Table:** [Backend/docs/API.md](../Backend/docs/API.md)

---

## 1. Response & Error Envelopes

All standard JSON routes (unless decorated with `@SkipEnvelope()`) are wrapped by `ResponseEnvelopeInterceptor`:

```typescript
interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number; requestId?: string };
  timestamp: string;
  requestId?: string;
}

interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string | string[];
  details?: unknown;
  timestamp: string;
  requestId?: string;
}
```

Frontend `apiClient` in [client.ts](../Frontend/src/lib/api/client.ts) unwraps `.data` automatically and coordinates single-flight refresh rotation (`POST /auth/refresh`) on `401 Unauthorized`. Binary downloads (`/files/download`, `/reports/:type`, `/reports/files/download`, `/documents/:id/download`) use authenticated `apiDownload()`.

---

## 2. Verified Key Endpoint Contracts

### Authentication & Sessions
- `POST /auth/login` → `{ loginId, password, collegeCode?, deviceName? }` → `{ accessToken, refreshToken, expiresIn, sessionId }`
- `POST /auth/refresh` → `{ refreshToken }` → rotated token pair
- `POST /auth/logout` / `POST /auth/logout-all` → revokes current session or all sessions (`204 No Content`)
- `GET /users/me` → active user profile with `userRoles`, permissions, `studentId`, `teacherId`, and linked wards

### Attendance & Faculty Delivery
- `GET /attendance/teacher/scheduled-sessions?date=YYYY-MM-DD` → timetable-authorized lecture slots for roll call
- `GET /attendance/scheduled-sessions/:slotId/roster?date=YYYY-MM-DD` → enrolled roster and existing markings
- `POST /attendance` → `{ subjectOfferingId, date, timetableSlotId?, periodKey?, defaultStatus?, records: [{ studentId, status: "PRESENT" | "ABSENT" | "LATE", remark? }] }`
- `GET /attendance/sessions?subjectOfferingId=...&date=...` → recorded session & student marks
- `GET /attendance/students/:studentId/report|records|calendar` & `GET /students/me/attendance[/records|/calendar]`
- `POST /attendance/correction-request` → `{ attendanceId?, subjectOfferingId?, date?, newStatus, reason }`
- `POST /attendance/corrections/:id/review` → `{ approve: boolean, note? }` (`HOD` / `COLLEGE_ADMIN`, non-self-approval)

### Assignments & Examinations
- `POST /files/attachments` (`multipart/form-data` `file`) → `{ key }` (scanned by `ProductionMalwareScanner`)
- `POST /assignments/:id/submit` → `{ text?, fileKeys?: string[] }`
- `POST /assignments/submissions/:submissionId/grade` → `{ marks, feedback? }`
- `PUT /exams/:id/results` → `{ results: [{ studentId, marksObtained, reason? }] }` (saved as `DRAFT`)
- `POST /exams/:id/publish` → publishes results and triggers CGPA recalculation

### Fees & Payment Gateways
- `GET /students/me/fees` & `GET /fees`
- `POST /fees/:id/payments` → `{ gateway: "mock" | "razorpay" | "stripe", amount? }` → returns `{ paymentId, gatewayRef, checkoutUrl?, clientPayload? }`
- `POST /fees/payments/:paymentId/complete` → `{ succeed?: boolean }` (dev/test `mock` gateway only)
- `POST /fees/webhooks/:gateway` (`@Public()`, raw-body HMAC-SHA256 verified for Razorpay `x-razorpay-signature` and Stripe `stripe-signature`)
- `GET /fees/payments/:paymentId/receipt` & `/receipt/admin`

### Complaints / Grievances
- `POST /complaints/route-preview` → `{ text }` → `{ category, priority, assignedDepartment, slaHours }`
- `POST /complaints` → `{ subject, description, category?, priority? }` → creates `GRV-YYYY-NNNNN` ticket
- `POST /complaints/:id/status` → `{ status, note? }`, `POST /complaints/:id/assign`, `POST /complaints/:id/comments`, `POST /complaints/:id/feedback`

### AI Copilot & Knowledge Base
- `POST /ai/chat` → `{ message, conversationId?, studentId? }` → `{ conversationId, reply, agent, mode: "tool" | "rag" | "direct", citations?, collegeData?, pendingDraftId?, disclaimer }`
- `GET /ai/agents`, `GET /ai/conversations`, `GET /ai/conversations/:id/messages`, `DELETE /ai/conversations/:id`
- `GET /ai/advisor?studentId=...`
- `POST /ai/grievance/drafts/:id/confirm` & `DELETE /ai/grievance/drafts/:id`
- `POST /ai/knowledge/ask` & `POST /ai/knowledge/search` → `{ question, documentType?, academicYear?, semesterNumber? }`

---

## 3. Socket.IO `/realtime` Contracts

Clients connect to `${NEXT_PUBLIC_SOCKET_URL}/realtime` with `{ auth: { token: accessToken } }` ([RealtimeGateway](../Backend/src/realtime/realtime.gateway.ts) & [AiChatGateway](../Backend/src/ai/chat/chat.gateway.ts)).

| Direction | Event | Payload | Purpose |
| :--- | :--- | :--- | :--- |
| Server → User (`user:<id>`) | `notification` | `{ id, type, title, body, data?, createdAt }` | Persisted in-app notification & async `ReportReady` (`data.fileKey`) delivery |
| Server → User (`user:<id>`) | `complaint.status` | `{ complaintId, ticketNo, status }` | Live grievance status update & query cache invalidation |
| Server → User (`user:<id>`) | `message` | `{ conversationId, message }` | New direct message delivery |
| Server → Tenant (`tenant:<id>`) | `announcement` | `{ noticeId, title }` | Published campus notice broadcast |
| Client → Server | `attendance.subscribe` | `{ subjectOfferingId }` | Join `offering:<id>` live roll-call room (`assertManagesOffering`) |
| Server → Offering (`offering:<id>`) | `attendance.marked` | `{ subjectOfferingId, date, periodKey, created }` | Live roll-call update broadcast |
| Client → Server | `ai.chat` | `{ requestId, message, conversationId?, studentId? }` | Initiate streamed AI reply |
| Server → Socket | `ai.token` / `ai.done` / `ai.error` | `{ requestId, token }` / `{ requestId, ...ChatResponse }` / `{ requestId, message }` | Token streaming, final structured reply, or rate-limit/validation error |
