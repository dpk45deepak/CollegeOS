# Database Design & Invariants

PostgreSQL (`pgvector`) accessed via **Prisma 5.22 ORM** (`Backend/prisma/schema.prisma`) serves as the single authoritative system of record for tenancy, academic state, workflows, and vector retrieval.

## Prisma Model Inventory

### Institution Structure
- `College`, `Campus`, `Department`, `Program`, `Batch`, `Semester`, `Section`
- `Subject`, `SubjectOffering`, `Room`, `Enrollment`

### Identity, Access & Sessions
- `User`, `Role`, `Permission`, `RolePermission`, `UserRole`
- `AuthSession`, `LoginAttempt`, `OneTimeToken`, `OAuthAccount`
- `Student`, `Guardian`, `StudentSkill`, `StudentPortfolioItem`
- `Teacher`, `TeacherAvailability`, `LeaveRequest`

### Academic Operations
- `TimetableSlot`, `TimetableException`
- `AttendanceSession`, `Attendance`, `AttendanceCorrection`
- `Assignment`, `Submission`
- `GradingScheme`, `Exam`, `ExamResult`

### Student Services & Communications
- `FeeStructure`, `StudentFee`, `Payment`, `Refund`
- `Scholarship`, `ScholarshipApplication`
- `Company`, `Job`, `PlacementDrive`, `JobApplication`, `Interview`, `Offer`
- `Complaint`, `ComplaintEvent`
- `Notice`, `Club`, `CampusEvent`
- `Conversation`, `ConversationParticipant`, `Message`
- `Notification`, `PushDevice`

### Knowledge, AI & Governance
- `Document`, `DocumentChunk` (with `pgvector` embeddings and `DocumentVisibility`)
- `AcademicRiskAssessment`
- `AuditLog`, `AiCallLog`

---

## Core Data & Security Invariants

1. **Multi-Tenant Isolation:**
   - Every tenant-owned record scopes cleanly by `collegeId`.
   - Tenant identity is derived from the authenticated principal (`Principal.collegeId`) or validated header context, never trusted unconditionally from client bodies.
2. **Financial Precision (`fee-math.ts`):**
   - Monetary amounts and balances use PostgreSQL `Decimal` types and integer paise conversion helpers (`toPaise` / `fromPaise`) to avoid floating-point drift.
   - Payment webhooks settle inside `$transaction` with atomic `updateMany` guards (`status = PENDING`) for idempotency.
3. **Attendance Auditability:**
   - Duplicate attendance markings within the same session/student are prevented by schema uniqueness.
   - Corrections preserve original vs. requested states, reason, requester, reviewer, and write immutable `AuditLog` entries; requesters cannot self-approve (`attendance.service.ts`).
4. **Immutable Audit Trail:**
   - Sensitive mutations (marks updates, fee waivers/refunds, role changes, attendance corrections) append structured `AuditLog` records queryable via `/audit` and `/audit/entity/:entity/:id`.

---

## Migrations & Development Seeding

```bash
cd Backend
npx prisma generate
npx prisma migrate deploy     # or npx prisma migrate dev in local development
npm run db:harden             # applies prisma/sql/hardening.sql
SEED_PASSWORD='Dev-Passw0rd-123' npm run seed
```

`Backend/prisma/seed.ts` refuses execution when `NODE_ENV=production` and requires an explicit strong `SEED_PASSWORD` (no hardcoded credentials).
