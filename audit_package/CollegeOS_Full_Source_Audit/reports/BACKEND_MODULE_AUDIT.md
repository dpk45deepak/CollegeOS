# Backend Module Audit

This report groups the bug register by backend domain. “Reviewed” means the primary controller/service/DTO paths were inspected; it does not imply every helper, test, or every possible input combination was executed.

| Backend domain | Review status | Main findings |
|---|---|---|
| Auth | Core reviewed | resend verification auth gap; long token vs six-digit UI; verify-email reactivation; refresh/token races; SMTP delivery |
| Access / tenancy | Core reviewed | super-admin missing tenant can create unscoped Prisma filters; role department IDs not validated |
| RBAC / users | Core reviewed | department scope references unchecked; shared default passwords; frontend role normalization drops backend roles |
| Academic | Core reviewed | college bootstrap not atomic; batch/program/department relationship not validated; audit gaps |
| Students | Core reviewed | academic hierarchy consistency missing; transactional create skips verification dispatch; update is not atomic |
| Teachers | Core reviewed | transactional create skips verification dispatch; HOD leave list is college-wide; offering/enrollment integrity needs stricter checks |
| Attendance | Core reviewed | UTC vs college timezone; correction uniqueness race; shortage list capped at 1,000; weekly dedupe key mismatch |
| Assignments | Core reviewed | resubmission can clear attachments; file upload UI does not upload; pending count uses total submissions; missing response adapter mismatch |
| Examinations | Core reviewed | boolean query conversion; Exam Controller role cannot use some permitted actions; frontend status/admit-card/result mismatches |
| Timetable | Core reviewed | HOD scope missing; validity filters incomplete; conflict-check/insert race; availability range validation |
| Fees | Core reviewed | production mock gateway; order-success UI; webhook amount validation; local-only refund; duplicate fee assignment |
| Scholarships | Core reviewed | inactive/expired applications allowed; status transitions not enforced; nested response adapter mismatch |
| Placements | Core reviewed | maxBacklogs ignored; frontend invents CTC/match scores; enum mismatches |
| Complaints | Core reviewed | priority override; state machine/UI mismatch; assignment target role unchecked; location/timeline adapters |
| Campus / notices | Core reviewed | HOD can publish college-wide; event update does not validate club ownership; notice attachments/recipient shape |
| Messaging | Core reviewed | student-to-same-department teacher check incorrectly treated as HOD; direct-conversation duplicate race |
| Notifications | Partial | fan-out can abort on enqueue failure; push channel stub; retry/idempotency concerns; unread boolean parsing pattern |
| Documents / RAG | Core reviewed | reprocess authorization; no-op scanner; queue processing fallback; upload enum/field mismatch; Hindi lexical limitation |
| Storage | Core reviewed | no generic attachment download endpoint; local driver unsafe for serverless; no-op malware scanner |
| Analytics | Core reviewed | teacher/HOD scope overbroad; some endpoints are college-wide; frontend risk adapter mismatch |
| Reports | Core reviewed | HOD placement export not department-scoped; async jobs depend on worker |
| Search | Partial | HOD department complaint queue is not included in search scope |
| Portal | Partial | hardcoded Asia/Kolkata timezone; parent with multiple wards needs a selection flow |
| Admin / queues | Core reviewed | college admins can inspect/retry global queues despite SUPER_ADMIN-only comment |
| Redis / queue | Core reviewed | Redis service does not reconnect after retry exhaustion; Vercel worker/scheduler disabled |
| Health / config | Partial | Redis readiness may mark app unready during degraded-but-serving mode; production config does not require SMTP or durable storage |
| Prisma / database | Schema reviewed | 63 models; tenant composite constraints absent; duplicate-fee and concurrency invariants missing; hardening SQL separate from Prisma migrations |
| AI agents / tools | Partial | searchKnowledge contract mismatch; keyword retrieval is ASCII/English-only; vector dimension config mismatch risk; observability adapter fabricates log metadata |

## Additional backend notes

- `UsersService.create()` only sends verification when it owns the Prisma client rather than receiving a transaction client. Student/teacher creation pass a transaction client.
- `TenantGuard` intentionally permits SUPER_ADMIN without a tenant. That is unsafe for tenant-scoped routes unless every service explicitly handles the no-tenant case.
- `AccessService` has useful scope helpers, but several analytics/report/timetable paths bypass them.
- `NoopScanner` is wired as the default malware scanner.
- The backend has a real mock payment gateway implementation but no real provider implementation in the inspected gateway directory.
- The `db:setup` script applies hardening SQL; `prisma:deploy` does not.
