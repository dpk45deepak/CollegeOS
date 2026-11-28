# College OS: Testing & Verification Guide

College OS maintains automated test suites, static type-checking, linting, and production build checks across both **Frontend** and **Backend**.

---

## 1. Automated Verification Suites

### 1.1 Frontend (`Frontend/`)

```bash
cd Frontend
npx tsc --noEmit
npm test
npm run lint
npm run build
```

**Vitest Suites (`Frontend/src/__tests__/` — `8` files, `38` tests):**
- `ai.test.ts`: Supervisor chat (`POST /ai/chat`), citation/tool mapping (`mapBackendChatResponse`), Socket.IO streaming fallback, and `ApiError` error handling.
- `api-contracts.test.ts`: Pagination unwrapping, analytics response normalization (`adminApi.getAnalyticsData`), and payment gateway payload forwarding (`studentApi.payFee`).
- `attendance.test.ts`: Attendance shortage math, 75% threshold rules, and recovery lecture projection.
- `auth-session.test.ts`: Login, `/users/me` hydration, session storage, refresh token rotation, and logout cleanup.
- `preferences.test.ts`: Shared `college_os_preferences` persistence, corruption recovery, and custom sync event dispatch.
- `roles-and-contracts.test.ts`: Role route/permission guards (including Student/Teacher/HOD boundaries) and authenticated download URLs.
- `student-workflows.test.ts`: Student submission, grievance transitions, exam status derivation, and scholarship/placement payloads.
- `teacher-workflows.test.ts`: Faculty scheduled session roster and roll-call contract assertions.

**Observed Outcome:** `npx tsc --noEmit` (`0` errors), Vitest **`8/8` files (`38/38` tests passed)**, `next lint` (`0` errors), and `next build` (**`48/48` routes compiled**).

---

### 1.2 Backend (`Backend/`)

```bash
cd Backend
npm run typecheck
npm run lint
npm test
npm run build
```

**Jest Suites (`Backend/src/**/*.spec.ts` — `36` suites, `199` tests):**
- **Auth, Access & Security:** `auth.service.spec.ts`, `users.service.spec.ts`, `access.service.spec.ts`, `guards.spec.ts`, `p0-security.spec.ts`, `env.validation.spec.ts`, `all-exceptions.filter.spec.ts`, `response-envelope.interceptor.spec.ts`, `pagination.dto.spec.ts`.
- **Academic & Operations:** `attendance-math.spec.ts`, `attendance.service.spec.ts`, `conflicts.spec.ts`, `examinations.service.spec.ts`, `grading.spec.ts`, `complaints.service.spec.ts`, `workflow.spec.ts`, `matching.spec.ts`, `eligibility.spec.ts`, `scholarships.service.spec.ts`, `risk.spec.ts`, `csv.spec.ts`, `file-validation.spec.ts`.
- **Payments & Messaging:** `fee-math.spec.ts`, `fees.service.spec.ts`, `payment-gateways.spec.ts` (`RazorpayGateway` / `StripeGateway` mocked-`fetch` + HMAC signature tests), `messaging-policy.spec.ts`, `messaging.service.spec.ts`, `notification-policy.spec.ts`, `channels.spec.ts` (`PushChannel` OneSignal/FCM mocked-`fetch` tests).
- **AI & RAG:** `intent-router.spec.ts`, `chunker.spec.ts`, `rag.spec.ts`, `visibility.spec.ts`, `study-plan.spec.ts`, `complaint-draft.spec.ts`, `tool-registry.spec.ts`.

**Observed Outcome:** `tsc --noEmit` (`0` errors), ESLint (`0` errors), Jest **`36/36` suites (`199/199` tests passed)**, and `prisma generate && nest build` (`0` errors).

**End-to-End Suites (`Backend/test/`):** `smoke.e2e-spec.ts` and `security.e2e-spec.ts` run via `npm run test:e2e` against a running PostgreSQL + Redis instance (`E2E_DB`).

---

## 2. Core User Journeys Covered

1. **Authentication & Multi-Session Safety:** Login via `{ loginId, password, collegeCode }`, `15m` access / rotating `7d` refresh tokens, account lockout after 5 failures, and `/auth/logout-all` session revocation.
2. **Timetable-Driven Roll Call & Corrections:** Scheduled lecture lookup, per-student roll call (`PRESENT` / `ABSENT` / `LATE`), 75% shortage tracking, dispute filing, and HOD/Admin approval with audit trail.
3. **Fee Billing & Hosted Checkouts:** Structure creation, batch assignment, counter/online payments (`mock`, `razorpay`, `stripe`), webhook settlement, refunds, and verified e-receipts.
4. **Grounded AI & Policy Search:** Multi-agent routing across live scoped tools and permission-filtered `pgvector` documents, streaming via `/realtime` (`ai.chat`), and explicit user confirmation for complaint drafts.
