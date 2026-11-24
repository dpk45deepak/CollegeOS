# Deployment, Environment, Integrations, and Testing Audit

## Deployment risks

### Vercel/serverless
The inspected code explicitly disables worker auto-run and scheduled job registration when `VERCEL` is set. The Vercel API handler boots the Nest HTTP app but does not attach the Socket.IO adapter. Unless a separate persistent worker/realtime service is deployed, the following should be considered unavailable:
- document processing and embedding jobs
- async report jobs
- queued notification dispatch
- scheduled attendance/risk/fee/scholarship jobs
- Socket.IO realtime notifications/chat

### Storage
The example configuration defaults to local storage at `./uploads-dev`. That is not durable storage for a serverless deployment. Production should require S3/R2 or another durable object store.

### Ports and CORS
Observed configuration inconsistencies:
- Backend example `PORT=3000`
- Next.js `next dev` defaults to port 3000
- Next rewrite fallback points to `http://localhost:4000`
- Backend CORS example includes 5173 and 3001, not 3000
- Frontend example API URL points to a deployed URL rather than local backend
- `APP_URL` example uses 5173, not the default Next dev port

Choose and document one topology, then align scripts, env examples, rewrite, CORS, and email links.

### Email
`SMTP_URL` is blank in the example and not required by production validation. The email service can drop messages without causing the calling flow to fail.

### Database hardening
`prisma:deploy` only runs Prisma migrations. `db:setup` additionally runs `db:harden`. Docker entrypoint runs setup; other deployment pipelines must do so explicitly.

### Payment
The repository contains only the mock gateway implementation in the inspected gateway directory. Production must not expose mock checkout as a real payment flow.

## Test inventory observed

- Backend unit specs: 27 `.spec.ts` files
- Backend E2E specs: 3 `.e2e-spec.ts` files
- Frontend tests: 4 files
- Frontend browser E2E framework: none found in package scripts/dependencies
- Prisma migrations: 1 SQL migration

The checked-in `docs/TESTING_AND_VERIFICATION.md` reports:
- 27 backend suites / 156 tests passing
- 4 frontend files / 18 tests passing
- backend and frontend builds passing

Those are repository documentation claims. **They were not freshly reproduced during this audit.**

The database-backed security E2E suite is conditional on `E2E_DB=1`; a default test run can skip those tests. The smoke suite uses test doubles, and frontend API contract tests use mocked payloads rather than the real Nest API.

## Runtime verification still required

A real verification pass should execute, at minimum:
1. `npm ci` in Backend and Frontend
2. `npm run typecheck`, `npm test`, `npm run build`
3. `npm run test:e2e` with `E2E_DB=1` and an isolated PostgreSQL database
4. Prisma migrate + hardening against a clean database
5. Redis outage/recovery test
6. SMTP verification/reset email test
7. Real file upload/download/scanner test
8. Real payment provider sandbox checkout, webhook signature, amount mismatch, duplicate webhook, refund, and reconciliation tests
9. Vercel deployment test for queue worker, scheduler, and WebSocket behavior
10. Browser E2E for each role: SUPER_ADMIN, COLLEGE_ADMIN, HOD, TEACHER, STUDENT, PARENT, ACCOUNTANT, EXAM_CONTROLLER, PLACEMENT_OFFICER, SUPPORT_STAFF, LIBRARY_STAFF

No production credentials or real customer data should be used in test runs.
