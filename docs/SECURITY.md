# College OS: Security Architecture & Controls

## 1. Authentication & Token Lifecycle

College OS enforces an enterprise-grade authentication protocol:
- **Access Tokens:** Signed RS256/HS256 JSON Web Tokens with a short 15-minute time-to-live (`JWT_ACCESS_TTL=15m`).
- **Refresh Tokens:** High-entropy opaque tokens with a 7-day time-to-live (`JWT_REFRESH_TTL=7d`).
- **Refresh Token Rotation:** Every refresh operation invalidates the existing token and issues a new pair. If a revoked or reused refresh token is presented, the entire session family is instantly invalidated.
- **Immediate Revocation via Redis:** Sessions revoked via `/auth/logout` or user deactivation are cached in Redis with a 24-hour TTL, allowing JWT auth guards to reject compromised tokens without querying the PostgreSQL database on every request.
- **Account Lockout:** Rate-limited at 5 consecutive failed login attempts. After 5 failures, the account is locked for 15 minutes (`423 ACCOUNT_LOCKED`), preventing credential stuffing and brute-force attacks.

---

## 2. Multi-Tenant Isolation

- Every institution is partitioned as a `College` tenant.
- All persistent relational models (students, teachers, subjects, attendance, marks, fees, complaints, documents) carry a mandatory `collegeId` foreign key.
- The `TenantGuard` and `AccessService` intercept every incoming request and enforce `tenant === user.collegeId`.
- Cross-tenant queries are blocked at both the service layer and Prisma query filters.

---

## 3. Role-Based Access Control (RBAC)

The single source of truth for permissions is `Backend/src/auth/permissions.ts`.

Key permission groups:
- **`STUDENT`:** `STUDENT_VIEW_OWN`, `ATTENDANCE_VIEW_OWN`, `TIMETABLE_VIEW`, `ASSIGNMENT_VIEW`, `ASSIGNMENT_SUBMIT`, `EXAM_VIEW`, `RESULT_VIEW_OWN`, `FEE_VIEW_OWN`, `COMPLAINT_CREATE`, `COMPLAINT_VIEW_OWN`, `AI_CHAT`.
- **`TEACHER`:** `ATTENDANCE_MARK`, `ATTENDANCE_VIEW`, `ATTENDANCE_CORRECT_REQUEST`, `ASSIGNMENT_MANAGE`, `RESULT_CREATE`, `RESULT_UPDATE`, `TIMETABLE_VIEW`, `LEAVE_REQUEST`.
- **`HOD`:** All Teacher permissions plus `ATTENDANCE_CORRECT_APPROVE`, `LEAVE_APPROVE`, `TIMETABLE_MANAGE`, `EXAM_MANAGE`, `COMPLAINT_MANAGE`, `DOCUMENT_UPLOAD`.
- **`COLLEGE_ADMIN`:** Institution-wide management of users, terms, sections, finances, and system observability.

Frontend route guards provide client-side navigation convenience only. **All mutations and data reads are independently authorized on the NestJS backend via `@RequirePermissions(...)`.**

---

## 4. AI & RAG Security Boundaries

1. **No Direct Database Access:** The LLM is never given direct SQL connection strings or raw database query capabilities.
2. **Tool-Checked Execution:** When the supervisor agent invokes tools (e.g., calculating attendance recovery or retrieving fee ledgers), the tool executes through standard authenticated NestJS services enforcing the caller's specific `Principal` permissions.
3. **Document Permission Filtering:** Vector embeddings stored in `pgvector` are annotated with `collegeId` and `DocumentVisibility` (e.g., `PUBLIC`, `STUDENTS`, `TEACHERS`, `ADMIN_ONLY`). RAG retrieval filters documents based on the authenticated user's scope before context is passed to the model prompt.
4. **Separation of Verified Facts vs Generated Recommendations:** AI chat responses strictly distinguish `collegeData` (unaltered institutional records) from generated prose recommendations.
5. **Human-in-the-Loop for Mutations:** Critical operations drafted by AI (such as grievance ticket submissions) require explicit, out-of-band user confirmation (`POST /ai/grievance/drafts/:id/confirm`) before being committed.

---

## 5. Network, Headers & Transport Security

- **Helmet:** HTTP response headers configured with CSP, HSTS, X-Content-Type-Options, and Frameguard.
- **CORS:** Explicit origin allowlist configured via `CORS_ORIGINS`. Permissive wildcard CORS (`*`) is prohibited in production.
- **Rate Limiting:** NestJS Throttler protects endpoints (`POST /auth/login` throttled to 10 requests/min; `POST /ai/chat` throttled to 30 requests/min).
- **Body Limits:** Strict 1MB JSON body parser limit prevents denial-of-service via oversized payloads. File uploads enforce multipart MIME validation and size ceilings.
