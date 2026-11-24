# Database and Security Audit

## Schema inventory

The Prisma schema contains **63 models**. The schema and single initial migration were inspected, along with `prisma/sql/hardening.sql`.

## Tenant isolation

Most tenant-owned models have a `collegeId`, but relation FKs generally reference only the related row's `id`, not a tenant-qualified key. That means tenant isolation is primarily enforced by service code. This is fragile when one service forgets to validate a related ID.

High-risk examples:
- `UserRole.departmentId` is not validated by `UsersService` against the user's tenant.
- `Student` carries department/program/batch/section/semester IDs, but create/update do not validate the full academic hierarchy.
- `FeeStructure` program/batch references are not consistently ownership-checked.
- `CampusEvent` update does not validate a replacement club ID.
- `Enrollment` and other tenant-owned joins rely on service validation rather than composite tenant FKs.

There are no tenant row-level security policies in the inspected Prisma schema or hardening SQL. This is not automatically a runtime vulnerability if the application layer is correct, but it means a leaked DB credential or missed service filter has no database-level tenant barrier.

## Missing uniqueness/idempotency invariants

| Model/workflow | Missing invariant | Consequence |
|---|---|---|
| StudentFee | Unique `(studentId, feeStructureId)` | Duplicate fee rows |
| AttendanceCorrection | One pending correction per attendance row | Concurrent duplicate corrections |
| TimetableSlot | No overlap exclusion constraint | Concurrent conflicting slots |
| Conversation | No unique direct participant pair | Duplicate direct conversations |
| Notification | No event/user idempotency key | Duplicate notifications on retries |
| Refund | No idempotency key / atomic remaining-balance invariant | Duplicate or excessive refunds |
| User / Role with nullable collegeId | PostgreSQL NULL uniqueness behavior | Duplicate global identities/templates possible |

## Vector and generated column

- `DocumentChunk.embedding` is fixed to `vector(1536)`.
- `AI_EMBEDDING_DIMENSIONS` is configurable.
- The provider only sends a requested `dimensions` value for OpenAI in the inspected OpenAI-compatible provider.
- `contentTsv` is a generated `tsvector` column created by the separate hardening SQL, not by the only tracked Prisma migration.

The database hardening script also creates the HNSW/GIN indexes and append-only AuditLog triggers. Deployments must run `db:setup` or otherwise apply the hardening script after migrations. Running only `prisma:deploy` is insufficient.

## Security controls that exist

- JWT access tokens and hashed refresh-token storage
- refresh-token family tracking
- account lockout counters
- global guards for JWT, tenant, and permissions
- ownership helper for many entity lookups
- append-only AuditLog trigger in hardening SQL
- document visibility policy
- file signature/type validation

## Security controls that are incomplete

- SUPER_ADMIN tenant selection is optional in TenantGuard.
- WebSocket revocation lacks HTTP guard's DB fallback.
- The default malware scanner is a no-op.
- Department IDs in user-role assignments are not tenant-validated.
- Several HOD/teacher reporting/analytics operations do not enforce the same scope as record APIs.
- Global queue administration allows College Admin despite the controller's own SUPER_ADMIN-only comment.
- Refund and webhook integrity checks are incomplete.
- Some important workflows do not produce AuditLog entries; audit write failures are swallowed.
