# Test Evidence and Limitations

## Repository test inventory

- 27 backend unit spec files under `Backend/src`
- 3 backend E2E spec files under `Backend/test`
- 4 frontend test files under `Frontend/src/__tests__`

Frontend test files:
- `ai.test.ts`
- `api-contracts.test.ts`
- `attendance.test.ts`
- `auth-session.test.ts`

Backend E2E files:
- `gen-docs.e2e-spec.ts`
- `security.e2e-spec.ts`
- `smoke.e2e-spec.ts`

## Important test configuration

`Backend/test/security.e2e-spec.ts` is conditional on `E2E_DB=1`. Without that environment variable, the database-backed security suite is skipped.

The checked-in `docs/TESTING_AND_VERIFICATION.md` reports 27 backend suites / 156 tests and 4 frontend files / 18 tests passing. This audit did not rerun those commands and does not certify those numbers for the current source snapshot.

## Not executed during this audit

- `npm ci`
- backend typecheck/build/unit tests
- frontend typecheck/build/tests
- DB migrations
- `db:harden`
- DB-backed E2E
- browser E2E
- Redis outage/recovery
- SMTP delivery
- payment provider sandbox/webhooks/refunds
- object storage upload/download
- Vercel worker/WebSocket behavior

## Required next evidence

For every fixed bug, add:
1. a regression test
2. a reproduction before fix
3. a passing verification after fix
4. the tested commit SHA
5. environment notes (DB/Redis/provider versions)
