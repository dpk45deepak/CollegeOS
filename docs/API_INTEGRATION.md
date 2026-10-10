# College OS: API Integration Specification

This document defines the single reliable API contract between the **Next.js Frontend** and the **NestJS Backend**.

**Base URL:** `http://localhost:3000/api/v1` (Production: configured via `NEXT_PUBLIC_API_URL`)  
**Prefix:** `/api/v1`  
**Tenant Identification:** College Code (default: `SDIET`)  

---

## 1. Response & Error Protocol

### 1.1 Success Response Envelope
All standard successful API responses (unless annotated with `@SkipEnvelope()`) are wrapped in:
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
  requestId?: string;
}
```

### 1.2 Error Response Envelope
All server-side errors are caught by `AllExceptionsFilter` and returned with HTTP status code and body:
```typescript
interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  errorCode: string;
  timestamp: string;
  requestId?: string;
}
```

**Common Error Codes:**
- `400 BAD_REQUEST / VALIDATION_ERROR`: Missing or malformed fields
- `401 UNAUTHORIZED / REFRESH_INVALID / REFRESH_EXPIRED`: Missing, invalid or expired token
- `403 FORBIDDEN / PERMISSION_DENIED`: Insufficient RBAC or cross-tenant access violation
- `404 NOT_FOUND`: Resource does not exist
- `409 CONFLICT / USER_EXISTS / RELATION_CONSTRAINT`: Duplicate constraint violation
- `413 PAYLOAD_TOO_LARGE`: Upload exceeds configured maximum size
- `423 ACCOUNT_LOCKED`: Exceeded maximum failed login attempts (15-minute lock)
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded
- `500 INTERNAL_ERROR`: Unexpected server error

---

## 2. Authentication & Session Endpoints

### `POST /api/v1/auth/login`
- **Auth Required:** No (Public)
- **Permissions:** None
- **Request DTO:**
  ```typescript
  interface LoginDto {
    loginId: string;       // e.g. "21CS042" or email
    password: string;      // 10+ characters
    collegeCode?: string;  // e.g. "SDIET" (optional for superadmin)
    deviceName?: string;   // optional client identifier
  }
  ```
- **Response DTO:**
  ```typescript
  interface TokenPair {
    accessToken: string;   // JWT valid for 15 minutes
    refreshToken: string;  // Opaque rotating token valid for 7 days
    expiresIn: string;     // e.g. "15m"
    sessionId: string;
  }
  ```
- **Frontend Usage:** `auth.ts` -> `LoginPage`

### `POST /api/v1/auth/refresh`
- **Auth Required:** No (Public)
- **Request DTO:** `{ refreshToken: string }`
- **Response DTO:** `TokenPair`
- **Frontend Usage:** Token refresh interceptor in `client.ts`

### `POST /api/v1/auth/logout`
- **Auth Required:** Yes (Bearer Token)
- **Response:** HTTP 204 No Content
- **Frontend Usage:** Profile menu / sign-out button

### `GET /api/v1/users/me`
- **Auth Required:** Yes (Bearer Token)
- **Permissions:** Any authenticated user
- **Response DTO:**
  ```typescript
  interface UserProfile {
    id: string;
    collegeId: string;
    loginId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING_VERIFICATION';
    userRoles: Array<{
      role: { key: string };
      departmentId?: string;
    }>;
  }
  ```
- **Frontend Usage:** User session hydration on application startup (`useAuthStore`)

---

## 3. Student Portal Endpoints

### `GET /api/v1/students/me/dashboard`
- **Auth Required:** Yes (Bearer Token)
- **Permissions:** `STUDENT_VIEW_OWN`
- **Response DTO:**
  ```typescript
  interface StudentDashboardAggregated {
    studentId: string;
    attendance: {
      overall: { attended: number; total: number; percentage: number | null; health: string };
      threshold: number;
      flags: Array<{ type: string; detail: string; subjectName?: string }>;
      worstSubjects: Array<{ subjectName: string; percentage: number | null }>;
    };
    todaysClasses: Array<{
      id: string;
      startTime: string;
      endTime: string;
      subject: { name: string; code: string };
      room: { number: string };
      teacher: { user: { firstName: string; lastName: string } };
    }>;
    assignmentsDue: Array<any>;
    upcomingExams: Array<any>;
    fees: { outstanding: number; next: string | null };
    notices: Array<any>;
    events: Array<any>;
    placementMatches: Array<{ jobId: string; title: string; company: string; compatibility: number; eligible: boolean }>;
    scholarships: { possible: number };
    complaints: { open: number };
    academicInsight: { level: 'LOW' | 'MEDIUM' | 'HIGH'; reasons: string[]; confidence: number };
    unreadNotifications: number;
  }
  ```
- **Frontend Usage:** `/student/dashboard`

### `GET /api/v1/students/me/attendance`
- **Auth Required:** Yes
- **Permissions:** `ATTENDANCE_VIEW_OWN`
- **Response DTO:**
  ```typescript
  interface StudentAttendanceReport {
    studentId: string;
    threshold: number;
    overall: SubjectAttendance;
    subjects: SubjectAttendance[];
    flags: AttendanceFlag[];
  }
  ```
- **Normalized UI Adapter Output:** `AttendanceSummary` with `overallPercentage`, `totalHeld`, `totalAttended`, `subjects[]`
- **Frontend Usage:** `/student/attendance`

### `GET /api/v1/students/me/timetable`
- **Auth Required:** Yes
- **Permissions:** `TIMETABLE_VIEW`
- **Response DTO:** List of timetable slots ordered by day and start time.
- **Frontend Usage:** `/student/timetable`

### `GET /api/v1/students/me/assignments`
- **Auth Required:** Yes
- **Permissions:** `ASSIGNMENT_VIEW`
- **Query Params:** `?page=1&limit=20&pending=true|false`
- **Frontend Usage:** `/student/assignments`

### `POST /api/v1/assignments/:id/submit`
- **Auth Required:** Yes
- **Permissions:** `ASSIGNMENT_SUBMIT`
- **Request DTO:** `{ fileUrl: string; fileName: string; fileSize?: number; textResponse?: string }`
- **Frontend Usage:** Assignment submission modal

### `GET /api/v1/students/me/exams`
- **Auth Required:** Yes
- **Permissions:** `EXAM_VIEW`
- **Frontend Usage:** `/student/exams`

### `GET /api/v1/students/me/results`
- **Auth Required:** Yes
- **Permissions:** `RESULT_VIEW_OWN`
- **Frontend Usage:** `/student/results`

### `GET /api/v1/students/me/fees`
- **Auth Required:** Yes
- **Permissions:** `FEE_VIEW_OWN`
- **Frontend Usage:** `/student/fees`

### `POST /api/v1/fees/:id/payments`
- **Auth Required:** Yes
- **Permissions:** `FEE_VIEW_OWN`
- **Request DTO:** `{ gateway: 'RAZORPAY' | 'STRIPE'; amount: number }`
- **Frontend Usage:** Fee payment dialog

---

## 4. Grievance / Complaints Endpoints

### `GET /api/v1/complaints/my`
- **Auth Required:** Yes
- **Permissions:** `COMPLAINT_VIEW_OWN`
- **Query Params:** `?page=1&limit=20&status=OPEN|RESOLVED`
- **Frontend Usage:** `/student/complaints`

### `POST /api/v1/complaints`
- **Auth Required:** Yes
- **Permissions:** `COMPLAINT_CREATE`
- **Request DTO:**
  ```typescript
  interface CreateComplaintDto {
    title: string;
    description: string;
    category?: 'ACADEMIC' | 'FACULTY' | 'INFRASTRUCTURE' | 'HOSTEL' | 'TRANSPORT' | 'IT' | 'FEES' | 'SCHOLARSHIP' | 'EXAMINATION' | 'ATTENDANCE' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    attachments?: string[];
  }
  ```
- **Frontend Usage:** File complaint modal

### `POST /api/v1/complaints/route-preview`
- **Auth Required:** Yes
- **Request DTO:** `{ text: string }`
- **Response DTO:** Predicted category, urgency, designated desk, and estimated SLA.
- **Frontend Usage:** Instant smart routing preview

---

## 5. Scholarships & Placements Endpoints

### `GET /api/v1/scholarships`
- **Auth Required:** Yes
- **Permissions:** `SCHOLARSHIP_VIEW`
- **Frontend Usage:** `/student/scholarships`

### `GET /api/v1/scholarships/matches`
- **Auth Required:** Yes
- **Permissions:** `SCHOLARSHIP_VIEW`
- **Response DTO:** List of matched scholarships with met/unmet eligibility criteria.
- **Frontend Usage:** Matched scholarships tab

### `POST /api/v1/scholarships/:id/apply`
- **Auth Required:** Yes
- **Permissions:** `SCHOLARSHIP_VIEW`
- **Response DTO:** Application receipt
- **Frontend Usage:** Apply button

### `GET /api/v1/placements/jobs`
- **Auth Required:** Yes
- **Permissions:** `PLACEMENT_VIEW`
- **Frontend Usage:** `/student/placements`

### `GET /api/v1/placements/jobs/recommendations`
- **Auth Required:** Yes
- **Permissions:** `PLACEMENT_APPLY`
- **Response DTO:** Ranked list of recommended jobs with compatibility scores and matched skills.
- **Frontend Usage:** Recommended jobs feed

### `POST /api/v1/placements/jobs/:id/apply`
- **Auth Required:** Yes
- **Permissions:** `PLACEMENT_APPLY`
- **Frontend Usage:** Job application submission

---

## 6. Faculty & Administration Endpoints

### `GET /api/v1/subject-offerings`
- **Auth Required:** Yes
- **Permissions:** `ORG_VIEW`
- **Frontend Usage:** Teacher class roster and schedule

### `POST /api/v1/attendance`
- **Auth Required:** Yes
- **Permissions:** `ATTENDANCE_MARK`
- **Request DTO:**
  ```typescript
  interface MarkAttendanceDto {
    subjectOfferingId: string;
    date: string; // ISO date
    slotNumber?: number;
    records: Array<{
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    }>;
  }
  ```
- **Frontend Usage:** Faculty attendance submission (`/teacher/attendance`)

### `GET /api/v1/attendance/corrections`
- **Auth Required:** Yes
- **Permissions:** `ATTENDANCE_VIEW`
- **Frontend Usage:** Correction queue for faculty and HOD

---

## 7. AI Copilot & Document RAG Endpoints

### `POST /api/v1/ai/chat`
- **Auth Required:** Yes
- **Permissions:** `AI_CHAT`
- **Request DTO:**
  ```typescript
  interface ChatDto {
    message: string;
    conversationId?: string;
    studentId?: string; // For parents/advisors
  }
  ```
- **Response DTO:**
  ```typescript
  interface ChatResponse {
    conversationId: string;
    reply: string;
    agent: string;           // ACADEMIC | ATTENDANCE | SCHOLARSHIP | PLACEMENT | GRIEVANCE | KNOWLEDGE
    mode: 'rag' | 'tools' | 'conversational';
    citations: Array<{
      documentId: string;
      title: string;
      pageNumber?: number;
      snippet: string;
      score: number;
    }>;
    collegeData: Array<{
      tool: string;
      ok: boolean;
      summary: string;
      data?: any;
    }>;
    pendingDraftId?: string;
    disclaimer: string;
  }
  ```
- **Frontend Usage:** `/student/ai` Copilot workspace

### `GET /api/v1/ai/advisor`
- **Auth Required:** Yes
- **Permissions:** `AI_CHAT`
- **Response DTO:** Academic priorities, risk assessment, study recommendations.
- **Frontend Usage:** Copilot Advisor view
