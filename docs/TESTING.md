# College OS: Testing & Verification Guide

## 1. Test Architecture & Automated Suites

College OS maintains separate automated test suites for frontend user journeys, authentication contracts, and backend services.

### 1.1 Running Frontend Tests
Frontend unit, mathematical calculation, and API integration contract tests are executed using **Vitest**:
```bash
cd Frontend
npm test
```
**Test Suites:**
- `src/__tests__/attendance.test.ts`: Mathematical attendance calculation, threshold boundary classifications (safe/warning/danger), consecutive lecture recovery formula: `(attended + x) / (total + x) >= 0.75`.
- `src/__tests__/ai.test.ts`: AI Copilot supervisor integration (`POST /api/v1/ai/chat`), official institutional records tool executions (`attendance_calculator`, `exam_scheduler`, `scholarship_matcher`), citation mapping, and verification that offline/503 states throw `ApiError` rather than returning canned mock replies.
- `src/__tests__/auth-session.test.ts`: Institutional authentication flow (`POST /api/v1/auth/login` and `GET /api/v1/users/me`), session persistence in localStorage, token rotation, logout revocation, and verification that unauthenticated requests throw `ApiError` without fallback to fake fixtures.

**Frontend Test Outcome:**
- 3 test files, 13 tests passed (100% pass rate).

### 1.2 Running Backend Tests
Backend domain services, guards, interceptors, and policies are tested using **Jest**:
```bash
cd Backend
npm test
```
**Test Coverage Areas:**
- `auth.service.spec.ts`: Login credential verification, lockout logic (5 failures = 15-minute lock), access/refresh token generation.
- `attendance-math.spec.ts`: Threshold calculations and sudden decline algorithms.
- `all-exceptions.filter.spec.ts`: Standardized error envelope formatting (`{ success: false, statusCode, message, errorCode }`).
- `response-envelope.interceptor.spec.ts`: Success envelope wrapping (`{ success: true, data, meta }`).
- `guards.spec.ts`: JwtAuthGuard, RolesGuard, and PermissionsGuard enforcement.
- `rag.spec.ts`: Semantic document chunking, embeddings, and vector similarity search.
- `tool-registry.spec.ts`: AI Copilot supervisor tool execution and RBAC permission checks.
- `timetable/conflicts.spec.ts`: Classroom, faculty, and section schedule collision detection.
- `matching.spec.ts`: Placement candidate qualification ranking.

**Backend Test Outcome:**
- 27 test suites, 156 tests passed (100% pass rate).

---

## 2. Production User Journeys Verified

### Journey 1: Public Informational Website
1. **Action:** Guest opens `http://localhost:3001/` (or production web origin).
2. **Result:** Public marketing and informational portal renders without requiring credentials.
3. **Verification:**
   - Features, architecture, attendance intelligence, and AI governance are explained.
   - Zero hardcoded mock students or fake operational metrics (such as fabricated student counts).
   - "Institutional Sign In" navigation link directs users to `/login`.
   - Visiting `/demo` cleanly redirects to `/`.

### Journey 2: Institutional Authentication & Session Restoration
1. **Action:** Institutional user navigates to `/login`, enters their College ID (e.g. `21CS042` or `FAC-CSE-108`) and institutional password.
2. **Result:** Form dispatches `POST /api/v1/auth/login` to the NestJS backend.
3. **Verification:**
   - Backend returns JWT `accessToken`, `refreshToken`, and session metadata.
   - Frontend validates credentials and fetches verified profile from `GET /api/v1/users/me`.
   - User is routed directly to their role-specific dashboard (`/student/dashboard`, `/teacher/dashboard`, `/hod/dashboard`, or `/admin/dashboard`).
   - Browser refresh automatically restores the active session via `authStore.initialize()`.
   - Logging out dispatches `POST /api/v1/auth/logout`, clears tokens, and redirects to `/login`.

### Journey 3: Student Academic & Attendance Intelligence
1. **Action:** Authenticated student navigates to `/student/dashboard` and `/student/attendance`.
2. **Result:** Live dashboard displays real student name, enrolled courses, and verified lecture attendance.
3. **Verification:**
   - Real attendance percentages are retrieved from `GET /students/me/dashboard` and `GET /attendance/student/me`.
   - Mathematical calculator models future attendance locally without altering official server records.
   - Empty states render cleanly when no lectures are scheduled for the current date.

### Journey 4: Faculty Lecture Attendance Submission
1. **Action:** Authenticated faculty member navigates to `/teacher/attendance`.
2. **Result:** Faculty portal queries active subject offerings from `GET /subject-offerings`.
3. **Verification:**
   - Selecting a lecture loads the real enrolled student roster from `GET /subject-offerings/:id/students`.
   - Faculty marks Present, Absent, or Late for each student.
   - Clicking "Submit Classroom Attendance" sends attendance records to `POST /api/v1/attendance`.

### Journey 5: AI Assistant Query Resolution
1. **Action:** Authenticated student asks "Why is my attendance low in DBMS?" in `/student/ai-assistant` or the floating drawer.
2. **Result:** Frontend dispatches query to `POST /api/v1/ai/chat`.
3. **Verification:**
   - NestJS supervisor agent executes authorized tools (`attendance_calculator.solve_threshold`).
   - Response contains official calculations and policy citations.
   - If backend AI service is unavailable, an informative error state is displayed with a retry button—never a hardcoded canned reply.

---

## 3. Production Build Validation

Both projects have been compiled in production mode with zero errors:
```bash
# Backend NestJS Build
cd Backend && npm run build
# Result: nest build completed successfully with exit code 0.

# Frontend Next.js 15 Build
cd Frontend && npm run build
# Result: next build completed successfully across all 35 static routes with exit code 0.
```
