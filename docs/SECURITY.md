# College OS: Security Architecture & Controls

## 1. Authentication & Token Lifecycle

College OS enforces an enterprise-grade authentication protocol:
- **Access Tokens:** Signed RS256/HS256 JSON Web Tokens with a short 15-minute time-to-live (`JWT_ACCESS_TTL=15m`).
- **Refresh Tokens:** High-entropy opaque tokens with a 7-day time-to-live (`JWT_REFRESH_TTL=7d`).
- **Refresh Token Rotation:** Every refresh operation invalidates the existing token and issues a new pair. If a revoked or reused refresh token is presented, the entire session family is instantly invalidated.
- **Immediate Revocation via Redis:** Sessions revoked via `/auth/logout` or user deactivation are cached in Redis with a 24-hour TTL, allowing JWT auth guards to reject compromised tokens without querying the PostgreSQL database on every request.
- **Account Lockout:** Failed login attempts are tracked (`LoginAttempt`) and locked for 15 minutes after 5 consecutive failures (`423` locked response), protecting against credential stuffing and brute-force attacks.
- **Global Session Revocation:** Users can revoke all active devices via `POST /api/v1/auth/logout-all`.

---

## 2. Multi-Tenant & Row-Level Isolation

- Every institutional tenant is isolated as a `College` record (`collegeId` foreign key across academic, financial, grievance, communication, and AI models).
- `TenantGuard` and `AccessService` resolve tenant scope strictly from the authenticated principal (`Principal.collegeId`) and department/section/ward relationships (`studentWhere`, `offeringWhere`, `assertStudent`, `assertManagesOffering`).
- Cross-tenant or cross-student ID guessing is rejected server-side (`403 SCOPE_DENIED` / `404`).

---

## 3. Role-Based Access Control (RBAC)

Single source of truth: [Backend/src/auth/permissions.ts](../Backend/src/auth/permissions.ts) (`11` system/institutional roles: `SUPER_ADMIN`, `COLLEGE_ADMIN`, `HOD`, `TEACHER`, `STUDENT`, `ACCOUNTANT`, `EXAM_CONTROLLER`, `PLACEMENT_OFFICER`, `LIBRARY_STAFF`, `SUPPORT_STAFF`, `PARENT`).

- Frontend navigation/UI checks only tailor UX; **every REST route and WebSocket handler enforces `@RequirePermissions(...)` / `@RequireAnyPermission(...)` or explicit principal permission checks on the NestJS server**.

---

## 4. File Uploads, Malware Scanning & Payment Webhooks

- **Content-Type & Malware Guard (`StorageModule` / `ProductionMalwareScanner`):** Uploaded attachments (`/files/attachments`, `/documents`) inspect binary file signatures (`detectFileType`) and scan via `CLAMAV_URL`. In `NODE_ENV=production`, uploads fail closed (`false`) unless `CLAMAV_URL` is configured or `ALLOW_NOOP_SCANNER=true` is explicitly set.
- **Webhook Signature Verification:** `POST /api/v1/fees/webhooks/:gateway` verifies raw-body HMAC-SHA256 signatures using constant-time `timingSafeEqual` (`x-razorpay-signature` for Razorpay, signed `t=...,v1=...` header for Stripe). Mock settlement (`POST /api/v1/fees/payments/:paymentId/complete`) is rejected whenever live gateways are active.

---

## 5. AI & RAG Security Boundaries

1. **No Direct Database Access:** The LLM never sees database credentials or SQL tools.
2. **Tool-Checked Execution:** Every tool invoked through `ToolRegistry` re-verifies the caller's `Principal.permissions` and `AccessService` row-level scope.
3. **Document Visibility Filtering:** `pgvector` retrieval filters chunks by `collegeId`, `status = READY`, and `DocumentVisibility` (`PUBLIC`, `STUDENTS`, `TEACHERS`, `STAFF`, `DEPARTMENT`, `ADMIN_ONLY`) before entering the prompt.
4. **Human-in-the-Loop Mutations:** AI-prepared grievance drafts require explicit confirmation (`POST /api/v1/ai/grievance/drafts/:id/confirm`).

---

## 6. Network, Headers & Transport Security

- **Helmet & CORS:** Configured security headers with explicit `CORS_ORIGINS` enforcement (`validateEnv` requires non-empty `CORS_ORIGINS` in production).
- **Rate Limiting & Payload Caps:** `@nestjs/throttler` guards auth and AI routes (`POST /ai/chat` capped at `30`/min, `GET /ai/advisor` at `10`/min, `POST /files/attachments` at `20`/min); `ValidationPipe` enforces `whitelist: true` and `forbidNonWhitelisted: true`.
