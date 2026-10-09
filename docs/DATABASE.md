# Database Design Guidelines

## System of record

Use PostgreSQL with Prisma ORM. Treat the database as the authoritative source for identity, academic records, workflows, and permissions. Use pgvector for document embeddings if enabled.

## Core entity groups

### Institution structure
- `College`, `Campus`
- `Department`
- `Program`
- `AcademicYear`, `Semester`, `Batch`, `Section`
- `Subject`, `Room`

### Identity and access
- `User`
- `StudentProfile`, `TeacherProfile`, and staff profiles as appropriate
- `Role`, `Permission`, role-permission and user-role relationships
- `Session` or refresh-token records

### Academic workflows
- `Enrollment`
- `TimetableEntry`
- `AttendanceSession`, `AttendanceRecord`, `AttendanceCorrectionRequest`
- `Assignment`, `Submission`, `Feedback`
- `Exam`, `ExamResult`, grading configuration

### Student services
- `FeeStructure`, `StudentFee`, `Payment`, `Receipt`
- `Scholarship`, `ScholarshipApplication`
- `Company`, `JobPosting`, `PlacementDrive`, `JobApplication`
- `Complaint`, `ComplaintAssignment`, `ComplaintEvent`
- `Notice`, `Event`, `Notification`, `Conversation`, `Message`

### AI and documents
- `Document`, `DocumentVersion`, `DocumentChunk`
- `AIConversation`, `AIMessage`, `AIToolExecution` (with privacy-aware retention)
- `AuditLog`

This is a conceptual inventory. Final tables and relations should follow actual feature requirements.

## Multi-tenant data isolation

Every tenant-owned record must be associated with a college/tenant directly or through a validated parent relationship. Resolve tenant identity from the authenticated session and verify related records belong to that tenant.

Do not trust a client-provided `collegeId` as proof of access. Consider PostgreSQL row-level security as an additional defense only if it can be configured and tested correctly; it does not replace application authorization.

## Modeling rules

- Use explicit foreign keys and unique constraints.
- Add `createdAt` and `updatedAt` where appropriate.
- Use enums for stable, bounded state sets; use lookup tables when values need administration.
- Store money as integer minor units or an appropriate fixed-precision decimal—not floating-point values.
- Use transactions for multi-record state changes.
- Use soft deletion only where product and compliance needs justify it; define how deleted records behave in reports and audit history.
- Never make audit history silently editable through ordinary application routes.

## Attendance invariants

Define whether attendance is tracked per lecture, per day, or using a configurable policy. A record should be tied to the relevant student, class/session, subject, section, and academic period. Prevent duplicate records with a suitable unique constraint.

Attendance corrections should preserve the original value, requested value, reason, requester, approver, decision, and timestamps. Avoid overwriting history without a trace.

## Indexing

Add indexes based on real query patterns, such as:
- tenant + academic year + department
- student + date/session
- section + subject + schedule time
- complaint status + assignee + created date
- document tenant + visibility + type
- notification recipient + read status + created date

Validate indexes with query plans and realistic data volumes; avoid indexing every field by default.

## Migrations and seed data

- Commit Prisma schema and migration history.
- Review migrations before production deployment.
- Keep seed data clearly development-only.
- Never include real student data or production credentials in repository seeds.
