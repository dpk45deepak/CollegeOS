# Recommended Fix Order

## Phase 0 — Block production release
1. Fix SEC-001: require tenant selection for SUPER_ADMIN on tenant-scoped routes.
2. Fix FIN-001: disable mock gateway in production and integrate a real provider.
3. Fix FIN-002/003: do not show payment success or issue receipts before settlement.
4. Fix FIN-003/004/005/006: implement provider-backed refunds, verify amount/currency, and make webhook/refund handling atomic/idempotent.
5. Fix SEC-009: replace NoopScanner with real malware scanning and fail closed.
6. Fix SEC-002/003/004/005/006: enforce HOD/tenant/queue scope.
7. Fix SEC-011: WebSocket session revocation DB fallback.
8. Fix AUTH-004/AUTH-003: ensure verification mail is sent and disabled accounts cannot be reactivated.

## Phase 1 — Repair core user journeys
1. Fix teacher attendance default PRESENT and period selection.
2. Implement student attendance correction as a real linked workflow.
3. Implement actual student/teacher assignment file upload and authenticated attachment download.
4. Align complaint status/priority enums and transition UX.
5. Fix student fees, scholarship, placement, results, and exam adapters to use real backend fields.
6. Fix documents type/visibility multipart contracts.
7. Fix exam-controller permission checks.
8. Enforce scholarship and placement eligibility on the backend.

## Phase 2 — Data integrity and operational resilience
1. Add tenant-aware relation validation/composite constraints.
2. Add StudentFee uniqueness and idempotency to corrections, refunds, notifications, conversations.
3. Fix timetable validity windows, department scope, and atomic conflict handling.
4. Fix Redis reconnect behavior.
5. Deploy persistent workers/scheduler/realtime service or redesign for serverless.
6. Require durable object storage and SMTP in production.
7. Make Prisma hardening a tracked migration.

## Phase 3 — Observability and test quality
1. Add browser E2E tests for all role workflows.
2. Run DB-backed security E2E in required CI.
3. Replace mocked frontend contract tests with OpenAPI-generated contracts.
4. Add tests for every finding ID in this register.
5. Add real payment sandbox tests and webhook replay tests.
6. Add upload malware/download tests.
7. Add multi-tenant tests for SUPER_ADMIN with missing/selected tenant headers.
8. Add test evidence with commit SHA and raw logs to each release.

## Release gate

Do not mark CollegeOS production-ready until:
- all Critical and High findings are fixed or explicitly accepted with compensating controls
- all P0/P1 regression tests pass
- DB migration + hardening is verified on a clean database
- every required background worker has a running consumer
- payment provider sandbox flow, refund, webhook replay, and reconciliation pass
- each role's browser E2E flow passes
