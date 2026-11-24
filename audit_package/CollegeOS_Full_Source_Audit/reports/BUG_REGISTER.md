# CollegeOS Bug Register

This register records source-supported defects and conditional risks found in the inspected `main` branch snapshot. Line numbers refer to the fetched source version and should be rechecked if the branch changes.

## A. Tenant isolation, authorization, and account security

### SEC-001 — Super-admin can enter tenant-scoped routes without selecting a tenant
- **Severity:** Critical
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/common/guards/tenant.guard.ts:27-45`; `Backend/src/access/access.service.ts`; `Backend/src/users/users.service.ts:82-99`; `Backend/src/students/students.service.ts`
- **Problem:** `TenantGuard` allows a SUPER_ADMIN request to continue when `tenantId` is undefined. Many downstream services build Prisma filters such as `{ collegeId: c }`. The Prisma schema does not enable `strictUndefinedChecks`; an undefined field is omitted from the query filter. For a super-admin request without `x-tenant-id`, a tenant-scoped list/report can therefore become a cross-tenant query.
- **Impact:** Cross-college student, user, attendance, report, and other tenant-owned data can be exposed through routes that assume the tenant guard always supplied a tenant.
- **Fix:** Require an explicit, validated `x-tenant-id` on every tenant-scoped route for SUPER_ADMIN. Separate platform-wide routes from tenant routes. Reject undefined tenant IDs at service boundaries and enable strict undefined handling where supported. Add a regression test for SUPER_ADMIN with no tenant header.

### SEC-002 — Analytics scope is broader than the caller's actual access
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/analytics/analytics.service.ts:10-16, 101-111, 122+`; `Backend/src/analytics/analytics.controller.ts`; `Backend/src/access/access.service.ts`
- **Problem:** `scopeDepartments()` returns `p.departmentIds` for every non-admin role, including ordinary teachers. A teacher's department ID is not equivalent to permission to inspect every student in that department. Some trend and department-breakdown methods do not receive the principal at all, so they return college-wide data to callers with `ANALYTICS_VIEW`.
- **Impact:** Teachers can receive risk/analytics data for students outside their own offerings; HODs and teachers can access college-wide trend/department aggregates.
- **Fix:** Scope teacher analytics through `AccessService.studentWhere()` / taught offerings. Scope HOD analytics to HOD departments. Pass the principal to every analytics method and enforce the same scope for all endpoints.

### SEC-003 — HOD placement reports are college-wide
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/reports/reports.service.ts:179-205`; `Backend/src/reports/reports.controller.ts`
- **Problem:** `placementReport(c)` queries job applications and student data by college only. The report includes student identifiers/names, CGPA, company, status, and offer/CTC fields. The report builder receives no principal/dept scope for this report.
- **Impact:** An HOD with `REPORT_EXPORT` can export placement data for other departments.
- **Fix:** Pass the principal into report builders and apply the same department/student scope as the corresponding read APIs. Add tests with two departments and verify HOD exports contain only their scope.

### SEC-004 — HOD leave queue returns every department's leave requests
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/teachers/teachers.service.ts` (`listLeaveRequests`); `Backend/src/teachers/teachers.controller.ts`
- **Problem:** The leave list filters to the teacher's own requests only when the principal has a teacher ID and does not have `LEAVE_APPROVE`. HODs have `LEAVE_APPROVE`, so their list query is tenant-wide. Review actions later enforce department scope.
- **Impact:** HODs can view leave reasons and details for teachers in other departments, while being unable to approve those requests.
- **Fix:** Add a department filter for HODs; keep college-wide access for College Admin only.

### SEC-005 — HOD can publish a college-wide notice
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/campus/campus.service.ts:30-55`
- **Problem:** The service comment says HODs may only target their own department, but the guard only rejects a different department when `dto.departmentId` is present. An omitted department ID is treated as college-wide. The publish path also permits an HOD when the notice has no department ID.
- **Impact:** A department HOD can publish a campus-wide announcement.
- **Fix:** Require HOD notices to include a department ID and verify it belongs to the HOD. Restrict college-wide publication to College Admin / explicitly authorized roles.

### SEC-006 — College Admin can inspect and retry shared cross-tenant queues
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/admin/admin.controller.ts:10-29`
- **Problem:** The controller comment says queues are shared across tenants and SUPER_ADMIN only, but the guard explicitly permits `COLLEGE_ADMIN`.
- **Impact:** A tenant admin can inspect global queue health and retry failed jobs belonging to other tenants. Failed-job metadata can also expose operational details.
- **Fix:** Enforce `p.isSuperAdmin` only, or isolate queues by tenant and authorize retry against the job's tenant.

### SEC-007 — Student can message any teacher in the same department as if that teacher were an HOD
- **Severity:** High
- **Status:** Confirmed source logic mismatch
- **Evidence:** `Backend/src/messaging/messaging.service.ts:63-80`
- **Problem:** The `hod` check compares the target teacher's department with `p.departmentIds`. Student principals include their own department ID, so any teacher in that department satisfies the HOD condition even when the student is not enrolled in that teacher's offering and the recipient is not an HOD.
- **Impact:** The intended student-to-enrolled-teacher / student-to-HOD messaging restriction is bypassed.
- **Fix:** Check the target user's actual HOD role and matching department scope. Keep the enrolled-offering check for ordinary teachers.

### SEC-008 — Any document-upload user can reprocess any tenant document
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/documents/documents.service.ts:195-202`; `Backend/src/documents/documents.controller.ts`
- **Problem:** `reprocess()` checks that the document belongs to the tenant, but does not check that the caller uploaded it or is an admin. Visibility is not checked either.
- **Impact:** A user with `DOCUMENT_UPLOAD` can trigger processing of another user's or ADMIN_ONLY document and change its processing state.
- **Fix:** Apply the same uploader/admin authorization used by `remove()` and `updateVisibility()`, and check visibility before allowing reprocessing.

### SEC-009 — Default malware scanner is a no-op
- **Severity:** High
- **Status:** Confirmed source configuration
- **Evidence:** `Backend/src/storage/storage.module.ts:11-40`
- **Problem:** `NoopScanner.isClean()` returns true and is wired as the default `MALWARE_SCANNER`.
- **Impact:** Uploaded files are accepted without malware scanning. File signature/extension checks are not a malware scanner.
- **Fix:** Use a real scanner (for example, ClamAV or a managed scanning service) in production. Fail closed if scanning is unavailable. Make the no-op scanner development-only.

### SEC-010 — User role department scopes are not validated as belonging to the tenant
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/users/users.service.ts:35-64,111-143`; `Backend/prisma/schema.prisma:533-543`
- **Problem:** `UsersService.create()` and `assignRoles()` validate role IDs against the tenant but do not validate `departmentIds`. `UserRole.departmentId` is a direct FK to `Department`, not a tenant-aware composite FK.
- **Impact:** A role assignment can link a tenant user to a department in another tenant or an unrelated department, corrupting access scope and organization data.
- **Fix:** Validate every department ID with `OwnershipService.assert('department', id, collegeId)` and add tenant-aware composite constraints.

### SEC-011 — WebSocket revocation does not fall back to the database when Redis is down
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/realtime/realtime.gateway.ts:41-49`; compare `Backend/src/common/guards/jwt-auth.guard.ts`
- **Problem:** WebSocket connection handling checks the Redis revocation key. When Redis is unhealthy, `safeExists()` returns false; unlike the HTTP JWT guard, the gateway does not query `AuthSession.revokedAt`.
- **Impact:** A logged-out/revoked session can continue or reconnect over WebSocket during a Redis outage.
- **Fix:** Share the same revocation-check service used by HTTP authentication, with a database fallback. Revalidate active sessions for long-lived sockets.

### SEC-012 — Email verification can reactivate an inactive account
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/auth/auth.service.ts:190-196`
- **Problem:** `verifyEmail()` unconditionally writes `status: ACTIVE` after consuming a valid email token. It does not require the user's current status to be `PENDING_VERIFICATION`.
- **Impact:** An account disabled by an administrator while an old verification token remains valid can become active again.
- **Fix:** Use a conditional update where status is `PENDING_VERIFICATION`; reject or preserve `INACTIVE` / `LOCKED` states.

### AUTH-001 — Refresh-token rotation is not atomic
- **Severity:** High
- **Status:** Concurrency defect; runtime reproduction required
- **Evidence:** `Backend/src/auth/auth.service.ts:101-125`
- **Problem:** Two concurrent refresh requests can both read the same active session before either revokes it. Both then call `revokeSession()` and create a new session in the same family; the update count is not checked.
- **Impact:** A single refresh token can produce multiple active descendant refresh tokens under concurrent requests.
- **Fix:** Perform a conditional `updateMany` with `revokedAt: null` and require exactly one updated row before creating the replacement token, preferably inside a transaction.

### AUTH-002 — One-time token consumption is vulnerable to concurrent reuse
- **Severity:** Medium
- **Status:** Concurrency defect; runtime reproduction required
- **Evidence:** `Backend/src/auth/auth.service.ts:311-317`
- **Problem:** `consumeToken()` reads `usedAt`, then performs an unconditional update. Two concurrent requests can both pass the read check and both consume the token.
- **Impact:** A supposedly one-time email verification or password-reset token can be accepted more than once under race conditions.
- **Fix:** Use a conditional `updateMany` where `usedAt: null` and `expiresAt > now`; require `count === 1`.

### AUTH-003 — Resend verification cannot be used by an unverified user
- **Severity:** High
- **Status:** Confirmed source/API mismatch
- **Evidence:** `Backend/src/auth/auth.controller.ts:113-119`; `Frontend/src/app/(auth)/verify-email/page.tsx:80`
- **Problem:** `POST /auth/resend-verification` is protected by the global JWT guard. Users whose email is not verified cannot complete login and therefore cannot obtain the bearer token required by this endpoint. The frontend calls it without an authenticated session.
- **Impact:** The resend button fails for the exact users who need it.
- **Fix:** Provide a public, throttled resend endpoint that accepts college code + email and returns a non-enumerating response.

### AUTH-004 — Student and teacher creation can skip verification email dispatch
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/users/users.service.ts:45-78`; `Backend/src/students/students.service.ts:39-53`; `Backend/src/teachers/teachers.service.ts:34-52`
- **Problem:** `UsersService.create()` only calls `sendVerification()` when no transaction client is supplied. Student and teacher creation call it inside a transaction, then commit without sending verification afterward.
- **Impact:** Users created without an initial password can remain `PENDING_VERIFICATION` without receiving the verification email. The resend endpoint is also protected, so they can be stuck.
- **Fix:** Dispatch verification after the transaction commits, or use an outbox event written in the same transaction and processed asynchronously.

### AUTH-005 — Email delivery can silently be dropped in production
- **Severity:** High
- **Status:** Conditional configuration defect
- **Evidence:** `Backend/src/notifications/channels/email.service.ts`; `Backend/.env.example`
- **Problem:** SMTP is optional in configuration. The email service logs/drops mail when no SMTP transport is configured instead of failing the operation. The example environment leaves `SMTP_URL` empty.
- **Impact:** Verification and password-reset flows can return success while no email is delivered.
- **Fix:** Require a working mail provider in production configuration and surface delivery failure through an outbox/retry state. Do not report a verification email as sent when it was dropped.

### AUTH-006 — Verification UI asks for a six-digit code, backend issues a long token
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Backend/src/auth/auth.service.ts:303-308`; `Backend/src/auth/dto/auth.dto.ts:47`; `Frontend/src/app/(auth)/verify-email/page.tsx:65,123,162`
- **Problem:** Backend tokens are 32 random bytes encoded as base64url and DTO validation requires a token of at least 20 characters. The frontend asks for a six-digit code.
- **Impact:** Manual code entry cannot work. Only the full emailed link/token path can succeed.
- **Fix:** Either implement a real six-digit OTP backend flow or change the UI to accept/paste the actual token and stop claiming a six-digit code is sent.

### AUTH-007 — Shared predictable initial passwords are prefilled for new accounts
- **Severity:** High
- **Status:** Confirmed source behavior
- **Evidence:** `Frontend/src/app/(admin)/admin/users/page.tsx:84,96`; `Backend/src/users/users.service.ts:45-56`
- **Problem:** The admin UI pre-fills `Student@12345` and `Faculty@12345`. When an initial password is supplied, the backend immediately marks the user ACTIVE and email verified; no forced password change is required.
- **Impact:** Accounts can be created with the same known credential across users.
- **Fix:** Generate one-time random credentials or invite links; force password setup on first login; never prefill shared credentials.

### AUTH-008 — Frontend tenant selection is fixed to one college and cannot log in a super-admin
- **Severity:** High
- **Status:** Confirmed frontend limitation
- **Evidence:** `Frontend/src/lib/api/auth.ts:34-67,85`; `Frontend/.env.example`; `Frontend/src/app/(auth)/login/page.tsx`
- **Problem:** The login API always supplies `NEXT_PUBLIC_COLLEGE_SHORT_CODE` or the hard-coded fallback `SDIET`. There is no tenant selector. Backend super-admin login requires no college code, but the frontend always supplies one.
- **Impact:** A single frontend build cannot log users into arbitrary colleges, and the platform super-admin cannot use the normal login UI.
- **Fix:** Add a tenant/college selection flow and a platform-admin login path that omits college code.

### AUTH-009 — “Remember me” does not change token persistence
- **Severity:** Medium
- **Status:** Confirmed UI behavior
- **Evidence:** `Frontend/src/app/(auth)/login/page.tsx:23,172`; auth store/API token persistence
- **Problem:** The checkbox state is not passed into login/token storage. Tokens are stored persistently in localStorage regardless of the checkbox.
- **Impact:** The UI promise is false; users who uncheck it still get persistent login.
- **Fix:** Implement session storage / persistent storage choice, or remove the checkbox.

## B. Payments and fee accounting

### FIN-001 — Production registers a mock payment gateway when no real gateway exists
- **Severity:** Critical
- **Status:** Confirmed source configuration
- **Evidence:** `Backend/src/fees/fees.module.ts:18-19`; `Backend/src/fees/gateways/mock.gateway.ts`; `Backend/src/fees/gateways/payment-gateway.ts`
- **Problem:** The gateway map starts empty and the condition includes `m.size === 0`, so the mock gateway is registered even in production. The repository contains the mock implementation but no real payment-provider implementation. The mock checkout URL uses a `.local` host.
- **Impact:** Production checkout is not a real payment integration. The application can create a mock order while appearing to offer online payments.
- **Fix:** Remove the `m.size === 0` production fallback. Fail startup or disable online checkout in production until a real gateway is configured and tested.

### FIN-002 — Student UI reports payment success immediately after order creation
- **Severity:** Critical
- **Status:** Confirmed frontend/backend workflow defect
- **Evidence:** `Frontend/src/app/(student)/student/fees/page.tsx:155-207`; `Backend/src/fees/fees.service.ts:156-163`
- **Problem:** Backend `startPayment()` creates a PENDING payment and an order. The frontend `onSuccess` handler sets `paymentSuccess(true)` immediately; it does not redirect to a real gateway or verify a successful webhook/settlement.
- **Impact:** A pending payment order is shown as a completed payment.
- **Fix:** Keep the state PENDING until a verified provider callback/return flow updates the payment. Poll/refresh payment status and display success only when backend status is SUCCESS.

### FIN-003 — Receipt UI fabricates a verified-success receipt
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(student)/student/fees/page.tsx:182,813`
- **Problem:** The receipt template hardcodes `VERIFIED / SUCCESS` and the success message contains a fixed receipt number `REC-2026-9812`. It is not tied to a settled payment's actual receipt number/status.
- **Impact:** Users can download a receipt that claims payment success when the payment is still pending or failed.
- **Fix:** Generate receipts only from the backend receipt endpoint for SUCCESS payments, using the real receipt number, tenant branding, payment method, and amount.

### FIN-004 — Refunds are marked processed without calling a payment provider
- **Severity:** Critical
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/fees/fees.service.ts:276-311`; `Backend/src/fees/gateways/payment-gateway.ts`
- **Problem:** The refund method creates a `Refund` with status `PROCESSED`, updates the payment status, and subtracts the amount from the student's fee ledger. The gateway interface exposes order creation and webhook verification, but no refund operation is called.
- **Impact:** The accounting ledger can show money refunded even though no money was returned through the original payment provider.
- **Fix:** Add provider-specific refund support, create a REQUESTED refund first, reconcile provider refund IDs/statuses, and only mark PROCESSED after provider confirmation. Treat manual refunds as a separately authorized manual process.

### FIN-005 — Webhook settlement does not verify the paid amount
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/fees/fees.service.ts:168-180`
- **Problem:** The verified webhook object contains payment details, but the service checks gateway reference and success state without comparing the webhook amount/currency to the expected payment amount/currency.
- **Impact:** A validly signed but underpaid/mismatched event can settle the expected invoice amount.
- **Fix:** Compare amount in minor units, currency, gateway reference, merchant/order ID, and payment ID before settlement.

### FIN-006 — Concurrent refund requests can over-refund a payment
- **Severity:** High
- **Status:** Concurrency defect; runtime reproduction required
- **Evidence:** `Backend/src/fees/fees.service.ts:276-296`; `Backend/prisma/schema.prisma:1060-1071`
- **Problem:** The total refunded amount is read before the transaction and no row lock or conditional update prevents two requests from both passing the same remaining-balance check.
- **Impact:** Two concurrent refunds can exceed the original payment amount.
- **Fix:** Lock the payment row or perform an atomic conditional update; add an idempotency key and a database invariant.

### FIN-007 — Reassigning a fee structure creates duplicate student fee rows
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/fees/fees.service.ts:65-80`; `Backend/prisma/schema.prisma:1017-1035`
- **Problem:** `assign()` uses `createMany()` without checking existing student/fee-structure pairs. `StudentFee` has no unique constraint on `(studentId, feeStructureId)`.
- **Impact:** Clicking Assign twice, or retrying the same operation, can charge students twice.
- **Fix:** Add a unique constraint and use `createMany({ skipDuplicates: true })` or an upsert/idempotent assignment transaction.

### FIN-008 — Fee structure accepts unchecked program/batch references
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/fees/fees.service.ts` (`createStructure`); `Backend/prisma/schema.prisma` (`FeeStructure`)
- **Problem:** Program/batch IDs are stored without the same tenant ownership checks used by other create flows.
- **Impact:** A tenant's fee structure can reference another tenant's program or batch.
- **Fix:** Validate program and batch ownership and ensure the batch belongs to the selected program/department.

### FIN-009 — Student fee adapter reads nonexistent amount fields and pays an aggregate against one fee
- **Severity:** High
- **Status:** Confirmed API integration defect
- **Evidence:** `Frontend/src/lib/api/student.ts:321-357`; `Backend/src/fees/fees.service.ts` (`forStudent`)
- **Problem:** Backend returns `amountDue` and `amountPaid`; the frontend sums `f.amount` and `f.paidAmount`. It aggregates outstanding across all fee rows but retains only the first fee ID for payment.
- **Impact:** Total/paid figures become zero or incorrect. A payment for the aggregate outstanding may exceed the first fee's outstanding amount and be rejected or applied to the wrong invoice.
- **Fix:** Match the backend response contract and present one payable invoice per fee row, or create a backend aggregate-payment endpoint that allocates payment across rows transactionally.

### FIN-010 — Failed/refunded payment states are displayed as PENDING
- **Severity:** Medium
- **Status:** Confirmed frontend mapping defect
- **Evidence:** `Frontend/src/lib/api/student.ts:335`
- **Problem:** Every payment status other than SUCCESS is mapped to PENDING.
- **Impact:** FAILED, REFUNDED, and PARTIALLY_REFUNDED payments are displayed incorrectly.
- **Fix:** Preserve the complete backend payment status enum and map each state explicitly.

## C. Academic data integrity and business workflows

### DATA-001 — Student academic hierarchy is not checked for consistency
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/students/students.service.ts:35-70,138-150`; `Backend/prisma/schema.prisma:603-620`
- **Problem:** Student create/update verifies that department, program, batch, section, and semester each belong to the college, but does not verify that the batch belongs to that program and department, that the semester belongs to that batch, or that the section belongs to that semester.
- **Impact:** A student can be attached to a logically impossible combination of program, department, batch, semester, and section.
- **Fix:** Validate the full hierarchy in one transaction using relation checks. Consider composite tenant/hierarchy constraints.

### DATA-002 — Batch can combine an unrelated program and department
- **Severity:** Medium
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/academic/academic.service.ts:117-123`
- **Problem:** The service checks that program and department belong to the college but does not verify the program/department relationship (or a program-department offering rule).
- **Impact:** Batch academic ownership can be inconsistent.
- **Fix:** Define the allowed program-department relationship and validate it on create/update.

### DATA-003 — Manual offering enrollment does not enforce section membership
- **Severity:** Medium
- **Status:** Confirmed source behavior; intended exceptions need product confirmation
- **Evidence:** `Backend/src/teachers/teachers.service.ts` (`enroll`); `Backend/src/prisma/schema.prisma` (`Enrollment`)
- **Problem:** The enrollment path checks tenant ownership but does not require the student to belong to the offering's section/semester.
- **Impact:** Students can be attached to an unrelated offering, affecting rosters, attendance, assignments, and teacher access.
- **Fix:** Enforce section/semester membership unless an explicit cross-section elective override is provided and audited.

### DATA-004 — Campus event update does not validate a replacement club's tenant
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/campus/campus.service.ts:133+`
- **Problem:** Event creation validates `clubId`; event update does not repeat the ownership check when `dto.clubId` changes.
- **Impact:** A tenant event can reference another tenant's club.
- **Fix:** Validate the new club ID on update and validate `endsAt > startsAt` on both create and update.

### DATA-005 — College bootstrap is not atomic
- **Severity:** Medium
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/academic/academic.service.ts:28-55`
- **Problem:** College creation, role synchronization, and first-admin creation are separate operations without one transaction.
- **Impact:** Failure during RBAC sync or admin creation can leave an orphan tenant or a tenant without a usable admin.
- **Fix:** Use a transaction for tenant + roles + admin creation, with a reliable post-commit email outbox.

### DATA-006 — Audit logging is incomplete and can fail silently
- **Severity:** High
- **Status:** Confirmed source design gap
- **Evidence:** `Backend/src/audit/audit.service.ts`; examples of missing audit calls in `Backend/src/timetable/timetable.service.ts`, `Backend/src/placements/placements.service.ts`, `Backend/src/scholarships/scholarships.service.ts`, and `Backend/src/campus/campus.service.ts`
- **Problem:** Several sensitive state changes do not create `AuditLog` entries. `AuditService.log()` catches persistence errors rather than failing the protected operation.
- **Impact:** Changes to academic, placement, scholarship, timetable, or complaint state may lack a reliable audit trail.
- **Fix:** Define mandatory audit events per workflow, persist them transactionally, and do not swallow audit failures for high-impact actions.

## D. Attendance, assignments, exams, timetable, and complaints

### ATT-001 — Attendance date handling uses UTC rather than the college timezone
- **Severity:** High
- **Status:** Confirmed source behavior
- **Evidence:** `Backend/src/attendance/attendance.service.ts`; `Frontend/src/app/(teacher)/teacher/attendance/page.tsx`; `Backend/src/portal/portal.service.ts`
- **Problem:** Attendance day boundaries and frontend default dates use UTC conversion, while the tenant schema has a configurable timezone. Portal logic also hardcodes `Asia/Kolkata`.
- **Impact:** Near-midnight attendance can be assigned to the wrong date or rejected as a future date for tenants whose local day differs from UTC.
- **Fix:** Resolve the tenant timezone and use a consistent local calendar-day conversion at the API boundary.

### ATT-002 — Attendance roster defaults every student to PRESENT
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/lib/api/teacher.ts:71,87`; `Frontend/src/app/(teacher)/teacher/attendance/page.tsx:71`
- **Problem:** Roster mapping defaults missing status to PRESENT and the page initializes roster rows as PRESENT. The roster endpoint is a class roster, not a date/session-specific saved attendance roster.
- **Impact:** A teacher can submit a fresh session with every student marked present unless they manually change each absent/late student. This can create false official attendance.
- **Fix:** Load the attendance session for the selected date/period and represent unmarked students as UNMARKED, not PRESENT. Require explicit confirmation for bulk-present marking.

### ATT-003 — Teacher attendance period is hardcoded to LEC_1
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(teacher)/teacher/attendance/page.tsx:34`; `Frontend/src/lib/api/teacher.ts:106`
- **Problem:** `selectedPeriod` is initialized to `LEC_1`, and submit defaults to `LEC_1`; no period selector is wired into the page.
- **Impact:** Multiple lectures on the same date can collide into the same attendance session.
- **Fix:** Load the timetable slots for the selected offering/date and let the teacher select the actual slot/period.

### ATT-004 — Student attendance dispute is a generic complaint, not an attendance correction
- **Severity:** High
- **Status:** Confirmed workflow gap
- **Evidence:** `Frontend/src/app/(student)/student/attendance/page.tsx`; `Backend/src/attendance/attendance.controller.ts`; `Backend/src/complaints/complaints.service.ts`
- **Problem:** The student page creates a generic complaint and does not submit a specific `attendanceId`/desired status into the correction workflow. The backend correction request permission is teacher-oriented.
- **Impact:** A complaint can be filed, but the attendance record itself is not corrected through the student workflow.
- **Fix:** Add a student correction-request endpoint that binds to the student's own attendance record, then route it through teacher recommendation/HOD approval.

### ATT-005 — Shortage report silently caps the student population at 1,000
- **Severity:** Medium
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/attendance/attendance-analytics.service.ts` (`shortageList`)
- **Problem:** The service fetches at most 1,000 students before applying the requested pagination.
- **Impact:** Colleges with more than 1,000 in-scope students can have missing shortage/defaulter rows and incorrect totals.
- **Fix:** Apply filtering and pagination in the database query, or process the full result set in bounded batches.

### ATT-006 — Weekly attendance notification key is not an ISO week
- **Severity:** Medium
- **Status:** Confirmed source mismatch
- **Evidence:** `Backend/src/attendance/attendance-analytics.service.ts` (`scanAndEmit`)
- **Problem:** The week key is computed by flooring Unix time by seven days, which is anchored to the Unix epoch rather than ISO calendar weeks.
- **Impact:** Notification deduplication can reset on the wrong weekday and produce duplicate/missed weekly notifications.
- **Fix:** Use a timezone-aware ISO week/year key.

### ATT-007 — Attendance correction duplicate prevention is race-prone
- **Severity:** Medium
- **Status:** Concurrency defect; runtime reproduction required
- **Evidence:** `Backend/src/attendance/attendance.service.ts` (`requestCorrection`); `Backend/prisma/schema.prisma:875-894`
- **Problem:** Pending correction count and insert are separate; schema has no unique pending-correction constraint.
- **Impact:** Concurrent requests can create multiple pending corrections for one attendance row.
- **Fix:** Use a transaction/row lock or a partial unique index enforcing one pending correction per attendance row.

### ASSIGN-001 — Student attachment input submits only the filename
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(student)/student/assignments/page.tsx:39-46,246-255`; `Frontend/src/lib/api/student.ts` (`submitAssignment`)
- **Problem:** File input stores only `file.name`; submit sends a text string such as “Submitted attachment: filename” and an empty `fileKeys` array. No file bytes are uploaded.
- **Impact:** The student UI reports submission success without delivering the actual attachment to the teacher.
- **Fix:** Upload the file through the storage endpoint, receive a storage key, and submit that key. Do not represent filename metadata as an uploaded file.

### ASSIGN-002 — Teacher assignment attachment input is inert
- **Severity:** Medium
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(teacher)/teacher/assignments/page.tsx:453`
- **Problem:** The file input has no `onChange`, upload call, or attachment-key state.
- **Impact:** Teachers cannot attach the resources the UI appears to offer.
- **Fix:** Wire file selection to storage upload and include returned keys in assignment creation.

### ASSIGN-003 — Text-only resubmission can clear existing submission attachments
- **Severity:** Medium
- **Status:** Confirmed source behavior
- **Evidence:** `Backend/src/assignments/assignments.service.ts` (`submit`)
- **Problem:** The update path defaults missing `fileKeys` to an empty array rather than preserving existing file keys.
- **Impact:** A student who edits only the text can lose previously uploaded attachments.
- **Fix:** Update `fileKeys` only when the request explicitly includes the property.

### ASSIGN-004 — Teacher “pending grading” count counts all submissions
- **Severity:** Medium
- **Status:** Confirmed adapter/query mismatch
- **Evidence:** `Frontend/src/lib/api/teacher.ts` (`getPendingAssignmentsToGrade`); `Backend/src/assignments/assignments.service.ts` (`list`)
- **Problem:** Frontend uses `_count.submissions` as pending-to-grade count, but that count includes already graded submissions.
- **Impact:** Teacher dashboard overstates pending grading workload.
- **Fix:** Return an explicit ungraded submission count from backend.

### ASSIGN-005 — Missing-submission adapter does not unwrap the backend response
- **Severity:** Medium
- **Status:** Confirmed API contract mismatch
- **Evidence:** `Backend/src/assignments/assignments.service.ts` (`missing`); `Frontend/src/services/api/assignments.api.ts`
- **Problem:** Backend returns an object with `pastDue` and `students`; the frontend normalizer looks for an array, `items`, or `data`.
- **Impact:** Missing-submission list can appear empty.
- **Fix:** Match the exact `{ pastDue, students }` response contract.

### EXAM-001 — `upcoming=false` query is converted to true
- **Severity:** Medium
- **Status:** Confirmed DTO bug
- **Evidence:** `Backend/src/examinations/dto/exams.dto.ts:62`
- **Problem:** `@Type(() => Boolean)` converts the non-empty query string `"false"` to JavaScript `true`.
- **Impact:** `?upcoming=false` filters as upcoming=true.
- **Fix:** Use an explicit string-to-boolean transform.

### EXAM-002 — Exam Controller role has permission but fails offering-manager checks
- **Severity:** High
- **Status:** Confirmed role workflow mismatch
- **Evidence:** `Backend/src/examinations/examinations.controller.ts`; `Backend/src/examinations/examinations.service.ts`; `Backend/src/access/access.service.ts`
- **Problem:** EXAM_CONTROLLER receives `EXAM_MANAGE`, but create/cancel paths use `assertManagesOffering()`, which recognizes admins, teachers, and HODs—not the exam-controller role.
- **Impact:** Exam Controller users receive authorization failures on operations their role permissions advertise.
- **Fix:** Add explicit exam-controller scope rules or route exam operations through a dedicated exam-management authorization method.

### EXAM-003 — Student exam adapter ignores backend exam status
- **Severity:** Medium
- **Status:** Confirmed frontend mapping defect
- **Evidence:** `Frontend/src/lib/api/student.ts` (`getExams`)
- **Problem:** The adapter derives status from scheduled date instead of preserving backend `SCHEDULED`, `ONGOING`, `COMPLETED`, or `CANCELLED`.
- **Impact:** Cancelled exams can appear upcoming or completed based only on their date.
- **Fix:** Preserve the backend status and map labels only for presentation.

### EXAM-004 — Admit card uses hardcoded program/department/semester
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(student)/student/exams/page.tsx:65`
- **Problem:** The template falls back to “Bachelor of Technology (CSE)” and “Semester 6”; the normalized auth profile does not supply the actual program/department.
- **Impact:** Students in other programs/semesters can receive incorrect admit-card details.
- **Fix:** Fetch the student's authoritative academic profile and render its actual program, department, batch, semester, and exam session.

### EXAM-005 — Student results adapter presents an invalid GPA/academic session
- **Severity:** High
- **Status:** Confirmed frontend calculation defect
- **Evidence:** `Frontend/src/lib/api/student.ts:275-304`; `Frontend/src/app/(student)/student/results/page.tsx:55`
- **Problem:** It hardcodes academic year/semester fallbacks, calculates SGPA and CGPA from the same result set, and uses the first/last result as strongest/weakest subject. The page also hardcodes “Top 8% of CSE Batch”.
- **Impact:** Official-looking results and insights can be wrong.
- **Fix:** Use backend-published SGPA/CGPA and real rank data; otherwise display “not available” rather than fabricated values.

### TIME-001 — HOD timetable management is not department-scoped
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/timetable/timetable.controller.ts`; `Backend/src/timetable/timetable.service.ts:149+`
- **Problem:** Timetable create/update/delete/availability paths receive tenant ID and actor ID but do not enforce the HOD's department scope.
- **Impact:** An HOD with `TIMETABLE_MANAGE` can change another department's slots or teacher availability.
- **Fix:** Pass the principal and enforce offering/teacher/room department scope for HODs.

### TIME-002 — Timetable reads ignore validity windows
- **Severity:** Medium
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/timetable/timetable.service.ts:122-140`
- **Problem:** `forSection()` does not filter `validFrom`/`validTo`; `forStudent()` filters `validTo` but omits `validFrom <= today`.
- **Impact:** Expired and future schedules can appear in current timetables.
- **Fix:** Apply both validity bounds consistently in every timetable read.

### TIME-003 — Timetable conflict check and create are not atomic
- **Severity:** Medium
- **Status:** Concurrency defect; runtime reproduction required
- **Evidence:** `Backend/src/timetable/timetable.service.ts` (`check`, `create`); `Backend/prisma/schema.prisma:810-826`
- **Problem:** Conflict check runs before insert and there is no database exclusion constraint or transaction-level locking.
- **Impact:** Concurrent timetable writes can both pass validation and create overlapping slots.
- **Fix:** Serialize schedule writes per teacher/room/section or add database exclusion constraints.

### TIME-004 — Teacher availability windows accept invalid time ranges
- **Severity:** Medium
- **Status:** Confirmed validation gap
- **Evidence:** `Backend/src/timetable/dto/timetable.dto.ts`; `Backend/src/timetable/timetable.service.ts:149+`
- **Problem:** Availability DTO validates numeric bounds but does not require end minute to be greater than start minute.
- **Impact:** Invalid availability windows can make conflict checks incorrect.
- **Fix:** Validate `endMinute > startMinute` and reject overlapping duplicate windows.

### COM-001 — Sensitive complaint priority can be downgraded by the submitter
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/complaints/complaints.service.ts` (`create`)
- **Problem:** Sensitive text forces the route/handler to college admin, but final priority is `dto.priority ?? routing.priority`, allowing the user-supplied priority to override the classifier's CRITICAL priority.
- **Impact:** Sensitive complaints can receive a lower SLA/priority despite the code comment that they are always critical.
- **Fix:** Enforce CRITICAL for sensitive categories after processing user-supplied fields.

### COM-002 — Frontend complaint statuses/priorities do not match backend enums
- **Severity:** High
- **Status:** Confirmed API contract mismatch
- **Evidence:** `Frontend/src/app/(student)/student/complaints/page.tsx:213-214,321,486-487,629`; `Frontend/src/lib/api/student.ts:520`; `Backend/src/complaints/dto/complaints.dto.ts`
- **Problem:** UI sends `IN_PROGRESS`, `SUBMITTED`, `UNDER_REVIEW`, and `URGENT`; backend uses `INVESTIGATING`, `OPEN`, `ASSIGNED`, and `CRITICAL` (among others).
- **Impact:** Status/priority updates can fail validation or be silently mapped to the wrong category.
- **Fix:** Share generated enum contracts or map explicitly at the API boundary.

### COM-003 — RESOLVED is a backend enum but not a valid transition target
- **Severity:** Medium
- **Status:** Confirmed workflow mismatch
- **Evidence:** `Backend/src/complaints/workflow.ts:4-16`; `Frontend/src/app/(student)/student/complaints/page.tsx:214,486-487`
- **Problem:** The workflow intentionally resolves to `AWAITING_FEEDBACK`; no transition permits entering `RESOLVED`, while the frontend offers RESOLVED.
- **Impact:** The UI's “Resolved” action is rejected by the state machine.
- **Fix:** Either add the intended transition or remove/map the frontend RESOLVED option to AWAITING_FEEDBACK.

### COM-004 — Teacher is shown a complaint queue they are not authorized to access
- **Severity:** Medium
- **Status:** Confirmed frontend/permission mismatch
- **Evidence:** `Frontend/src/app/(student)/student/complaints/page.tsx`; `Backend/src/auth/permissions.ts`
- **Problem:** The page treats TEACHER as staff and loads the staff queue, but TEACHER does not receive `COMPLAINT_MANAGE`. Conversely, accountant/exam-controller/support roles that do have complaint-management permission are not consistently represented in the frontend role mapping.
- **Impact:** Teachers see 403 errors; authorized staff may not see the queue.
- **Fix:** Drive the queue UI from actual permissions, not a hard-coded role list.

### COM-005 — Complaint assignment accepts any active tenant user
- **Severity:** Medium
- **Status:** Confirmed source validation gap
- **Evidence:** `Backend/src/complaints/complaints.service.ts` (`assign`)
- **Problem:** Assignee lookup checks active user and tenant but not whether the target user has a role/permission suitable for complaint handling or department scope.
- **Impact:** A complaint can be assigned to a student or unrelated staff member who cannot manage it.
- **Fix:** Require `COMPLAINT_MANAGE` and matching department/handler scope for the target user.

### COM-006 — Complaint location is collected by the frontend but not persisted
- **Severity:** Medium
- **Status:** Confirmed contract gap
- **Evidence:** `Frontend/src/lib/api/student.ts` (`createComplaint`); `Backend/src/complaints/dto/complaints.dto.ts`; `Backend/prisma/schema.prisma` (`Complaint`)
- **Problem:** The UI collects a location field, but the API adapter/backend DTO/model do not accept or store it.
- **Impact:** The location disappears after submission.
- **Fix:** Add a validated location field to the DTO/model or remove it from the form.

### COM-007 — Complaint timeline and assignee are synthesized/mapped incorrectly
- **Severity:** Medium
- **Status:** Confirmed frontend mapping defect
- **Evidence:** `Frontend/src/lib/api/student.ts` (`getComplaints`); `Backend/src/complaints/complaints.service.ts` (`mine`, `get`)
- **Problem:** Frontend expects `timeline` and `assignedTo.user`, while backend returns event/assignee shapes differently. The adapter generates generic timeline entries and fallback desk names.
- **Impact:** Students can see fabricated complaint history/assignee information.
- **Fix:** Add a dedicated detail endpoint returning event history and map the actual `assignedTo` user shape.

## E. Scholarships, placements, AI, documents, and analytics integration

### SCH-001 — Student can apply to inactive or expired scholarships by direct ID
- **Severity:** Medium
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/scholarships/scholarships.service.ts:85-108`
- **Problem:** The discovery/matches query filters active/open scholarships, but `express()` only checks tenant ownership and does not enforce `isActive` or deadline.
- **Impact:** A student can apply to a closed scholarship through the API.
- **Fix:** Enforce active/deadline rules inside `express()`, not only in list endpoints.

### SCH-002 — Scholarship decision can jump directly to DISBURSED
- **Severity:** Medium
- **Status:** Confirmed workflow gap
- **Evidence:** `Backend/src/scholarships/scholarships.service.ts:109+`
- **Problem:** Decision accepts APPROVED, REJECTED, or DISBURSED without validating the current application state.
- **Impact:** Applications can be marked disbursed without approval.
- **Fix:** Add explicit application status transitions and audit each decision.

### SCH-003 — Scholarship match response is nested but student adapter expects flat fields
- **Severity:** High
- **Status:** Confirmed API contract mismatch
- **Evidence:** `Backend/src/scholarships/scholarships.service.ts` (`matchesForStudent`); `Frontend/src/lib/api/student.ts:390-410`
- **Problem:** Backend returns `{ scholarship, match }`; frontend reads `s.id`, `s.name`, `s.provider`, and `s.amount` from the wrapper object and uses generic fallbacks.
- **Impact:** Scholarship cards can show generic names, fake amounts, missing IDs, and broken apply actions.
- **Fix:** Map `s.scholarship.*` and `s.match.*` explicitly.

### PLAC-001 — maxBacklogs is stored but not enforced
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/placements/matching.ts` (`MatchJob`); `Backend/src/placements/placements.service.ts` (`recommendations`, `apply`); `Backend/prisma/schema.prisma` (`Job.maxBacklogs`)
- **Problem:** `maxBacklogs` is present in the job model but omitted from matching and application eligibility logic.
- **Impact:** Students who exceed the employer's backlog limit can be recommended/allowed to apply.
- **Fix:** Include backlog count and `maxBacklogs` in matching and enforce it again at application time.

### PLAC-002 — Student placement cards show fabricated CTC and match score
- **Severity:** High
- **Status:** Confirmed frontend fallback defect
- **Evidence:** `Frontend/src/lib/api/student.ts:425-455`
- **Problem:** The adapter defaults missing CTC to `8.5 LPA`, match score to `92`, and supplies generic branches/skills/rounds when the backend does not return those fields.
- **Impact:** Students see invented job eligibility and compensation information.
- **Fix:** Use the recommendations endpoint returning `{ job, match }`; show unavailable fields as unavailable rather than inventing values.

### AI-001 — `searchKnowledge` sends the wrong request contract
- **Severity:** High
- **Status:** Confirmed API contract mismatch
- **Evidence:** `Frontend/src/services/api/ai.api.ts:117-120`; `Backend/src/ai/rag/rag.controller.ts`; `Backend/src/ai/rag/rag.dto.ts`
- **Problem:** Frontend sends `{ query, limit }`; backend Ask DTO expects `{ question, ...filters }`. With strict whitelist validation this request is rejected.
- **Impact:** The knowledge-search API helper fails even though `askKnowledge()` uses the correct `question` field.
- **Fix:** Send `{ question: query }` and implement `limit` only if the backend supports it.

### AI-002 — Hindi keyword-only retrieval is not supported by the lexical path
- **Severity:** Medium
- **Status:** Confirmed limitation; vector path may partially compensate
- **Evidence:** `Backend/src/ai/rag/reranker.ts` (`queryTerms`); `Backend/prisma/sql/hardening.sql`
- **Problem:** Lexical query tokenization strips non-ASCII characters and the generated tsvector uses the English dictionary.
- **Impact:** When AI embeddings are unavailable or chunks have no vectors, Hindi queries are unlikely to match Hindi document text through keyword retrieval.
- **Fix:** Add language-aware tokenization/full-text indexes and tests for Hindi queries; preserve vector fallback.

### AI-003 — AI observability log rows are fabricated from error summaries
- **Severity:** Medium
- **Status:** Confirmed frontend presentation defect
- **Evidence:** `Frontend/src/lib/api/admin.ts` (`getAILogs`); `Frontend/src/app/(admin)/admin/ai-observability/page.tsx`
- **Problem:** The adapter turns recent errors into “agent execution logs” and fills user role/name with generic values rather than actual execution records. The dashboard also uses a 100% success fallback when there are no calls.
- **Impact:** Observability dashboard can present synthetic users/logs and misleading success rates.
- **Fix:** Expose a real paginated AI-call/tool-execution endpoint and display N/A when there is no sample.

### ANA-001 — Risk adapter does not unwrap backend `{ students }`
- **Severity:** Medium
- **Status:** Confirmed API contract mismatch
- **Evidence:** `Backend/src/analytics/analytics.service.ts` (`riskList`); `Frontend/src/services/api/analytics.api.ts:83+`
- **Problem:** Backend returns an object containing `students`; frontend normalizer looks for an array, `items`, or `data`.
- **Impact:** At-risk student lists can render empty.
- **Fix:** Read `raw.students` and map the nested student/overall structure.

### ANA-002 — Teacher at-risk cards read the wrong fields
- **Severity:** Medium
- **Status:** Confirmed frontend mapping defect
- **Evidence:** `Frontend/src/lib/api/teacher.ts:132+`; `Backend/src/attendance/attendance-analytics.service.ts` (`shortageList`)
- **Problem:** Backend returns student identity under top-level `user` and attendance percentage under `overall.percentage`; frontend reads `student`, `name`, `percentage`, or `attendance`.
- **Impact:** Teacher cards can show “Student” and 0% for every at-risk student.
- **Fix:** Map `user.firstName`, `user.lastName`, and `overall.percentage`.

### ANA-003 — Admin department filter does not filter the dashboard
- **Severity:** Medium
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/app/(admin)/admin/analytics/page.tsx:34,134`
- **Problem:** `deptFilter` is stored and displayed but is not applied to query parameters or chart data.
- **Impact:** Selecting a department does not change the displayed analytics.
- **Fix:** Include the selected department in query keys/API calls and filter every relevant series.

### ANA-004 — Admin/HOD dashboard contains metrics that are always empty
- **Severity:** Medium
- **Status:** Confirmed integration gap
- **Evidence:** `Frontend/src/lib/api/admin.ts` (`getAnalyticsData`); `Frontend/src/app/(hod)/hod/dashboard/page.tsx:137-189`
- **Problem:** The adapter fills enrollment trend, CGPA distribution, placement stats, faculty workload, and subject pass-rate arrays with empty defaults because corresponding backend data is not returned by the called endpoints.
- **Impact:** Charts render empty/no-data states while the dashboard presents itself as an analytics surface.
- **Fix:** Implement backend aggregates or remove unsupported metrics from the UI until available.

### DOC-001 — Document reprocess authorization is missing
- **Severity:** High
- **Status:** Confirmed source defect
- **Evidence:** `Backend/src/documents/documents.service.ts:195-202`
- **Problem:** See SEC-008. Reprocessing lacks uploader/admin and visibility checks.
- **Fix:** Enforce ownership and visibility before enqueueing.

### DOC-002 — Document page defaults to an unsupported document type
- **Severity:** High
- **Status:** Confirmed frontend/backend enum mismatch
- **Evidence:** `Frontend/src/app/documents/page.tsx:53,280`; `Frontend/src/services/api/documents.api.ts:5-16`; `Backend/prisma/schema.prisma` (`DocumentType`)
- **Problem:** Frontend default `POLICY` and several UI types are not in backend `DocumentType` (`REGULATION`, `ATTENDANCE_POLICY`, `EXAM_RULES`, etc.).
- **Impact:** Default uploads can fail validation.
- **Fix:** Generate frontend enums from backend OpenAPI/schema or map UI labels to valid backend values.

### DOC-003 — Document visibility enum values do not match backend
- **Severity:** Medium
- **Status:** Confirmed frontend/backend enum mismatch
- **Evidence:** `Frontend/src/app/documents/page.tsx:296-297`; `Frontend/src/services/api/documents.api.ts:15-16`; backend `DocumentVisibility`
- **Problem:** Frontend sends `STUDENT_ONLY` / `FACULTY_ONLY`; backend expects `STUDENTS` / `TEACHERS`.
- **Impact:** Visibility changes/uploads can fail validation.
- **Fix:** Align enum values.

### DOC-004 — Role-restricted document upload uses the wrong multipart field name
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/documents.api.ts:60-62`; `Backend/src/documents/dto/documents.dto.ts`
- **Problem:** Frontend appends `allowedRoleKeys[]`; DTO property is `allowedRoleKeys`.
- **Impact:** Role-restricted uploads may fail whitelist validation or lose the role list.
- **Fix:** Append repeated `allowedRoleKeys` fields or normalize the bracketed field name in the upload controller.

### DOC-005 — Document processing can remain stuck after queue failure
- **Severity:** High
- **Status:** Confirmed source behavior; deployment impact conditional
- **Evidence:** `Backend/src/documents/documents.service.ts:60-102,195-202`; `Backend/src/ai/document-processing/document-processor.ts`
- **Problem:** Upload catches queue failure but leaves the document in UPLOADED state without synchronous fallback. Reprocess returns a queued-style response even if queue insertion fails.
- **Impact:** Documents may never become READY and remain unavailable to RAG.
- **Fix:** Persist an outbox job, retry enqueueing, or process synchronously in an explicit degraded mode. Return a truthful failure state.

### DOC-006 — Storage attachment keys have no download endpoint
- **Severity:** High
- **Status:** Confirmed route gap
- **Evidence:** `Backend/src/storage/storage.controller.ts`; `Frontend/src/services/api/storage.api.ts`; assignment/notice APIs return `fileKeys` / `attachmentKeys`
- **Problem:** Storage controller exposes attachment upload but no authenticated download/read route for those keys. Documents have their own download route, but general assignment/notice attachments do not.
- **Impact:** Uploaded assignment/notice attachments cannot be retrieved through the API.
- **Fix:** Add a tenant- and owner-authorized download endpoint that resolves storage keys without exposing raw paths.

### DOC-007 — Default document visibility can hide an uploaded document from its uploader
- **Severity:** Medium
- **Status:** Confirmed default behavior; UI may override it
- **Evidence:** `Backend/src/documents/documents.service.ts:60-62`; `Backend/src/documents/visibility.ts`
- **Problem:** Backend defaults omitted visibility to ADMIN_ONLY; document list visibility filtering does not automatically grant uploader access to ADMIN_ONLY documents.
- **Impact:** API clients that omit visibility can upload a document they cannot subsequently see.
- **Fix:** Either default to a safe but uploader-visible visibility or explicitly grant uploader access.

## F. Frontend role and contract coverage

### FE-ROLE-001 — Unsupported backend roles map to STUDENT
- **Severity:** High
- **Status:** Confirmed frontend defect
- **Evidence:** `Frontend/src/lib/api/auth.ts:34-67`; `Frontend/src/app/(admin)/admin/users/page.tsx:105`
- **Problem:** Frontend role normalization does not model all backend roles such as PARENT, EXAM_CONTROLLER, SUPPORT_STAFF, and LIBRARY_STAFF. Unknown roles fall back to STUDENT. It also selects a single role from the returned role list, which can hide secondary roles.
- **Impact:** Parent and staff users can land in the wrong portal and lose role-specific navigation/actions.
- **Fix:** Model all backend roles, preserve role sets, and derive permissions/navigation from the full role/permission payload.

### FE-ATT-API — Attendance API types do not match backend response contracts
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/attendance.api.ts`; `Backend/src/attendance/attendance.controller.ts`; `Backend/src/attendance/attendance.service.ts`
- **Problem:** `getSession` is typed as one session while backend returns a list; submit expects `{ success, count }` while backend returns `{ sessionId, created, skippedAlreadyMarked }`; query uses `subjectOfferingId` while backend filter uses `subjectId`; shortage/correction types also differ.
- **Impact:** Empty filters, incorrect success messages, and broken correction UI.
- **Fix:** Generate or share API contracts and test against actual controller responses.

### FE-STUDENT-001 — Student gender and portfolio enums do not match backend
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/students.api.ts`; `Backend/prisma/schema.prisma` (`Gender`, `PortfolioItemType`)
- **Problem:** Frontend uses values such as `PREFER_NOT_TO_SAY`, `PUBLICATION`, `INTERNSHIP`, and `COMPETITION`; backend uses `UNDISCLOSED` and only CERTIFICATION/PROJECT/ACHIEVEMENT.
- **Impact:** Unsupported profile/portfolio submissions fail validation.
- **Fix:** Align enums or implement explicit mappings.

### FE-EXAM-API — Exam frontend status types do not match backend
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/exams.api.ts`; `Backend/prisma/schema.prisma` (`ExamStatus`)
- **Problem:** Frontend types include statuses such as CONDUCTED/RESULTS_PENDING/PUBLISHED while backend returns SCHEDULED/ONGOING/COMPLETED/CANCELLED.
- **Impact:** UI status filters/badges can be incorrect.
- **Fix:** Preserve backend statuses and map labels separately.

### FE-PLAC-API — Placement application/interview enums do not match backend
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/placements.api.ts`; `Backend/prisma/schema.prisma` (`JobApplicationStatus`, `InterviewMode`)
- **Problem:** Frontend uses `INTERVIEWING` and `IN_PERSON`; backend uses `INTERVIEW` and `ONSITE`.
- **Impact:** Interview scheduling/status updates can fail validation.
- **Fix:** Align enum contracts.

### FE-SCH-API — Scholarship types do not match backend
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/scholarships.api.ts`; `Backend/prisma/schema.prisma` (`ScholarshipType`)
- **Problem:** Frontend includes MERIT/NEED_BASED/SPORTS/MINORITY/INSTITUTIONAL; backend only accepts GOVERNMENT/COLLEGE/PRIVATE.
- **Impact:** Scholarship creation/filtering can fail or map to the wrong category.
- **Fix:** Align types or add backend support for the intended categories.

### FE-MSG-API — Conversation type enum mismatch
- **Severity:** Low
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/messaging.api.ts`; `Backend/prisma/schema.prisma` (`ConversationType`)
- **Problem:** Frontend uses `ANNOUNCEMENT`; backend uses `DEPARTMENT_ANNOUNCEMENT`.
- **Impact:** Announcement conversations can be misclassified in UI.
- **Fix:** Align the enum.

### FE-CAMPUS-API — Notice model shape mismatch
- **Severity:** Medium
- **Status:** Confirmed contract mismatch
- **Evidence:** `Frontend/src/services/api/campus.api.ts`; `Backend/prisma/schema.prisma` (`Notice`); `Backend/src/campus/campus.service.ts`
- **Problem:** Frontend expects `published` boolean and attachment objects; backend returns `publishedAt` and `attachmentKeys`.
- **Impact:** Notice status/attachments can be missing or misrendered.
- **Fix:** Normalize backend response in one adapter and expose signed download URLs for attachments.

### FE-NOTIF-001 — `unread=false` query can be transformed to true
- **Severity:** Medium
- **Status:** Confirmed DTO pattern risk
- **Evidence:** `Backend/src/notifications` query DTOs (Boolean `@Type(() => Boolean)` pattern); `Frontend/src/services/api/notifications.api.ts`
- **Problem:** The same JavaScript Boolean conversion used in the exam DTO is unsafe for query strings; `Boolean("false")` is true.
- **Impact:** Read/unread filters can behave backwards.
- **Fix:** Use explicit string parsing and add tests for both `"true"` and `"false"`.

### FE-NOTIF-002 — Notification enqueue failure can stop fan-out to later recipients
- **Severity:** Medium
- **Status:** Confirmed source behavior
- **Evidence:** `Backend/src/notifications/notifications.service.ts:37-68`
- **Problem:** Queue insertion is inside the same try/catch around the recipient loop. A queue error can abort the loop after only some users were processed.
- **Impact:** Multi-recipient notifications may be delivered to only a subset of recipients.
- **Fix:** Persist all in-app notifications first, then enqueue each dispatch independently with per-recipient error handling/outbox retries.

### FE-DASH-001 — Teacher “today's classes” is not based on today's timetable
- **Severity:** Medium
- **Status:** Confirmed adapter behavior
- **Evidence:** `Frontend/src/lib/api/teacher.ts:39+`; `Backend/src/teachers/teachers.service.ts` (`listOfferings`); `Backend/src/timetable/timetable.service.ts`
- **Problem:** The helper maps the teacher's subject offerings rather than filtering timetable slots for the current day/time.
- **Impact:** Dashboard can label every assigned offering as today's class.
- **Fix:** Query the timetable for today's date and filter by active validity windows.

### FE-DOC-DATA — Student document metadata uses fabricated fallbacks
- **Severity:** Medium
- **Status:** Confirmed frontend mapping defect
- **Evidence:** `Frontend/src/lib/api/student.ts:540+`
- **Problem:** Adapter expects fields such as `fileSize`/`fileType` while backend returns `sizeBytes`/`mimeType`, then fills generic values and a fixed academic-year fallback.
- **Impact:** Document metadata can be inaccurate.
- **Fix:** Map actual backend fields and show unknown metadata as unavailable.

### FE-NOTIF-DATA — Notification API hides errors as an empty notification list
- **Severity:** Low
- **Status:** Confirmed frontend behavior
- **Evidence:** `Frontend/src/lib/api/student.ts` (`getNotifications`)
- **Problem:** Errors are caught and converted to `[]`.
- **Impact:** A server outage or authorization error appears as “no notifications”.
- **Fix:** Preserve the error state and show an explicit retry/error message.

## G. Operational and deployment findings

### DEP-001 — Vercel mode disables background workers and scheduled jobs
- **Severity:** High
- **Status:** Conditional deployment blocker
- **Evidence:** `Backend/src/analytics/scheduler.ts`; `Backend/src/ai/document-processing/document-processor.ts`; queue processor configuration; `Backend/api/index.ts`
- **Problem:** Worker auto-run and scheduler startup are disabled when `VERCEL` is set. The serverless handler only boots the API app. The repository does not provide a separate worker entrypoint/command that a Vercel-only deployment automatically runs.
- **Impact:** If the backend is deployed only as Vercel serverless functions, queued document processing, report jobs, notification dispatch, and scheduled analytics/alerts can remain unprocessed.
- **Fix:** Deploy a separate long-running worker/scheduler service (Docker/EC2/Render/etc.) against the same Redis and database, or replace the queue with a serverless-compatible job provider. Verify every processor has a live consumer.

### DEP-002 — Vercel API handler does not attach the WebSocket adapter
- **Severity:** High
- **Status:** Confirmed deployment limitation
- **Evidence:** `Backend/api/index.ts`; `Backend/src/main.ts`; `Backend/src/realtime/io.adapter.ts`
- **Problem:** The normal Nest bootstrap attaches the Socket.IO adapter; the Vercel handler does not. Vercel functions also do not provide a persistent Socket.IO server.
- **Impact:** Realtime notifications/chat features cannot be assumed to work on the serverless API URL.
- **Fix:** Host the WebSocket gateway on a persistent service or use a managed realtime provider.

### DEP-003 — Local storage default is unsafe for serverless production
- **Severity:** High
- **Status:** Conditional deployment blocker
- **Evidence:** `Backend/.env.example`; `Backend/src/storage/storage.module.ts`; `Backend/src/storage/storage.service.ts`; `Backend/src/config/env.validation.ts`
- **Problem:** Example configuration defaults to `STORAGE_DRIVER=local` and `./uploads-dev`. Production validation does not require S3/R2. Serverless filesystems are ephemeral and often read-only outside temporary paths.
- **Impact:** Uploads can fail or disappear between invocations/instances.
- **Fix:** Require S3/R2-compatible durable storage in production and validate its credentials/bucket at startup.

### DEP-004 — Local ports, CORS origins, and rewrite target disagree
- **Severity:** Medium
- **Status:** Confirmed configuration inconsistency
- **Evidence:** `Frontend/next.config.ts`; `Frontend/package.json`; `Frontend/.env.example`; `Backend/.env.example`
- **Problem:** Next dev defaults to port 3000; backend example also uses port 3000; Next rewrite fallback points to localhost:4000; CORS example allows 5173 and 3001 but not 3000; frontend example points to a deployed API URL.
- **Impact:** A fresh local setup can collide on port 3000 or proxy to the wrong backend port, and direct browser requests can fail CORS.
- **Fix:** Document one canonical local topology (for example backend 3000, frontend 3001, CORS 3001, rewrite/API URL 3000) and make scripts/examples consistent.

### DEP-005 — Prisma deploy script does not run database hardening SQL
- **Severity:** High
- **Status:** Conditional deployment defect
- **Evidence:** `Backend/package.json` (`prisma:deploy` vs `db:setup`); `Backend/prisma/sql/hardening.sql`; `Backend/prisma/schema.prisma:1421-1427`
- **Problem:** `prisma:deploy` runs only `prisma migrate deploy`; `db:setup` additionally runs `db:harden`. The generated `contentTsv` column, GIN/HNSW indexes, and append-only audit triggers are created by the separate hardening script. There is only one tracked Prisma migration file.
- **Impact:** A deployment pipeline that runs only `prisma:deploy` can miss the RAG `contentTsv` column/index and audit immutability triggers.
- **Fix:** Make hardening a tracked migration or make every deployment path run `db:setup`; add a post-deploy assertion for the generated column/index/triggers.

### DEP-006 — Production email configuration is not validated
- **Severity:** High
- **Status:** Conditional configuration defect
- **Evidence:** `Backend/.env.example`; `Backend/src/config/env.validation.ts`; `Backend/src/notifications/channels/email.service.ts`
- **Problem:** `SMTP_URL` is optional and no production startup validation ensures email delivery is configured.
- **Impact:** Account verification and password reset can silently fail.
- **Fix:** Require a working email provider in production or explicitly disable flows that depend on it.

### DEP-007 — Redis client does not recover after exhausting its retry strategy
- **Severity:** High
- **Status:** Confirmed availability defect
- **Evidence:** `Backend/src/redis/redis.service.ts:21-54`
- **Problem:** The retry strategy stops reconnecting after the configured retry attempt; `isHealthy()` returns the stored false state and does not initiate a reconnect.
- **Impact:** A transient Redis outage can leave the Redis service permanently in degraded mode for the lifetime of the process.
- **Fix:** Use a bounded reconnect/backoff strategy with a health probe that can re-establish the connection, and test outage/recovery.

### DEP-008 — Raw webhook body handling may fail on the Vercel adapter
- **Severity:** Medium
- **Status:** Runtime verification required
- **Evidence:** `Backend/api/index.ts`; `Backend/src/main.ts`; `Backend/src/fees/fees.controller.ts`
- **Problem:** The serverless adapter registers `express.json()` before Nest initialization. Payment webhook verification relies on raw request bytes and falls back to JSON reserialization when `rawBody` is absent. Re-serialized JSON is not guaranteed to match the provider's signed bytes.
- **Impact:** Valid payment-provider signatures may fail in the serverless deployment.
- **Fix:** Capture raw bytes before JSON parsing and test a real signed webhook through the deployed adapter.

## H. Database design and test coverage

### DB-001 — Tenant-owned relations are not protected by tenant-aware foreign keys
- **Severity:** High
- **Status:** Confirmed schema design gap
- **Evidence:** `Backend/prisma/schema.prisma` models `UserRole`, `Student`, `Batch`, `SubjectOffering`, `Enrollment`, `StudentFee`, `DocumentChunk`, and others
- **Problem:** Many models carry `collegeId`, but relations reference only a globally unique `id`, not `(collegeId, id)`. The application must enforce every cross-table tenant relationship itself; several paths do not.
- **Impact:** Cross-tenant references can be stored when a service omits an ownership/hierarchy check.
- **Fix:** Add composite unique keys and tenant-aware composite foreign keys where feasible, plus service-level validation.

### DB-002 — StudentFee lacks a unique student/fee-structure key
- **Severity:** High
- **Status:** Confirmed schema gap
- **Evidence:** `Backend/prisma/schema.prisma:1017-1035`
- **Problem:** There is no unique constraint on `(studentId, feeStructureId)`.
- **Impact:** Duplicate fee assignment can create duplicate charges.
- **Fix:** Add the unique constraint after cleaning existing duplicates.

### DB-003 — Several workflows rely on application-only uniqueness/concurrency checks
- **Severity:** Medium
- **Status:** Confirmed schema gap; impact varies by workflow
- **Evidence:** `Backend/prisma/schema.prisma:810-826,875-894,1297-1312,1341-1357`
- **Problem:** Timetable overlap, one pending attendance correction, one direct conversation per user pair, and notification idempotency are not enforced by database constraints.
- **Impact:** Concurrent requests/retries can create duplicate or conflicting records.
- **Fix:** Add exclusion/partial unique constraints or idempotency keys and make writes atomic.

### DB-004 — Nullable unique keys permit duplicate global identities/roles in PostgreSQL
- **Severity:** Medium
- **Status:** Database behavior risk
- **Evidence:** `Backend/prisma/schema.prisma:452-500,502-514`
- **Problem:** `User` and `Role` use unique constraints containing nullable `collegeId`. PostgreSQL's normal unique semantics allow multiple rows where the nullable component is NULL.
- **Impact:** Duplicate global SUPER_ADMIN users or global role templates can be created under races/manual writes.
- **Fix:** Use partial unique indexes for global rows or `NULLS NOT DISTINCT` where supported, and make bootstrap creation atomic.

### DB-005 — RAG vector dimension is fixed at 1536 while config is variable
- **Severity:** Medium
- **Status:** Configuration risk; provider-specific runtime verification required
- **Evidence:** `Backend/prisma/schema.prisma:1421`; `Backend/src/config/env.validation.ts`; `Backend/src/ai/ai-client.service.ts`; `Backend/src/ai/providers/openai-compat.provider.ts`
- **Problem:** Database column is `vector(1536)`, but `AI_EMBEDDING_DIMENSIONS` is configurable. The OpenAI-compatible provider only sends the `dimensions` request field for OpenAI.
- **Impact:** A provider/model returning a different dimension can pass configuration but fail when stored in PostgreSQL.
- **Fix:** Enforce exactly 1536 for this schema or implement a controlled dimension migration/model-specific adapter and validate returned vectors before persistence.

### TEST-001 — Security E2E suite is conditional
- **Severity:** High
- **Status:** Confirmed test configuration gap
- **Evidence:** `Backend/test/security.e2e-spec.ts`
- **Problem:** Database-backed security tests are skipped unless `E2E_DB=1`.
- **Impact:** A normal test run can pass without executing the tenant-isolation tests.
- **Fix:** Run the security suite in CI against an ephemeral PostgreSQL database and make it a required check.

### TEST-002 — Frontend has no browser E2E suite
- **Severity:** High
- **Status:** Confirmed test coverage gap
- **Evidence:** `Frontend/package.json`; `Frontend/src/__tests__/`
- **Problem:** The frontend has four test files (18 tests in the checked-in report) and no Playwright/Cypress browser workflow.
- **Impact:** Role journeys, file upload, payment, and real API integration are not tested end-to-end.
- **Fix:** Add Playwright coverage for login, student attendance/complaints, assignment upload/submission, fee payment, HOD queue, document upload/download, and staff role journeys.

### TEST-003 — Frontend contract tests use mocks rather than the actual backend
- **Severity:** Medium
- **Status:** Confirmed test design gap
- **Evidence:** `Frontend/src/__tests__/api-contracts.test.ts`; `Frontend/src/__tests__/auth-session.test.ts`
- **Problem:** Tests validate hand-authored mocked payloads, not responses from the real Nest controllers/DTOs. Several mismatches in this register are therefore not detected.
- **Impact:** The test suite can pass while frontend adapters fail against the backend.
- **Fix:** Generate OpenAPI types and add contract tests against a running backend or schema snapshots.

### TEST-004 — Runtime/build/test claims were not independently reproduced in this audit
- **Severity:** High
- **Status:** Not executed
- **Evidence:** `docs/TESTING_AND_VERIFICATION.md`; package scripts in `Backend/package.json` and `Frontend/package.json`
- **Problem:** Repository documentation reports 27 backend suites / 156 tests and 4 frontend files / 18 tests passing, but this audit did not run those commands.
- **Impact:** Current branch runtime status remains unknown.
- **Fix:** Run `npm ci`, Prisma generation, backend tests, frontend tests, builds, migrations, and E2E workflows in a real environment; attach logs and commit SHA to the audit.
