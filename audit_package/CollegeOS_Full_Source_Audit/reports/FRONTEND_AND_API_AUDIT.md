# Frontend Pages and API Integration Audit

## High-impact route/workflow findings

| Route / area | Finding |
|---|---|
| Login | Tenant code fixed by build env/fallback; super-admin login cannot omit tenant code; Remember me checkbox does not alter persistence |
| Verify email | UI asks for six-digit code; backend issues a long random token; resend endpoint requires JWT |
| Admin users | Shared initial passwords are prefilled; role list displays only first role/department |
| Student attendance | Dispute becomes generic complaint, not a linked correction request |
| Teacher attendance | All roster rows default PRESENT; period fixed to LEC_1; no session-specific status load |
| Student assignments | File input stores filename only; no file upload; submit sends text metadata |
| Teacher assignments | File input has no handler/upload call |
| Student fees | Backend order creation is treated as payment success; fixed success receipt text/number |
| Student results | SGPA/CGPA are computed from same dataset; academic year/semester fallbacks and Top 8% text are hardcoded |
| Student exams | Admit card defaults to B.Tech CSE / Semester 6; exam status derived from date rather than backend status |
| Student scholarships | Backend returns nested `{ scholarship, match }`; adapter expects flat fields and uses generic amount/name fallbacks |
| Student placements | Adapter invents 8.5 LPA, 92% match, branches, skills, and interview rounds when backend fields are absent |
| Student complaints | Frontend statuses/priorities do not match backend; timeline/assignee data is synthesized or mapped incorrectly |
| Documents | Default `POLICY` type and `STUDENT_ONLY` / `FACULTY_ONLY` visibility values are not backend enums |
| Admin analytics | Department filter is state-only; enrollment/CGPA/placement chart arrays are empty |
| HOD dashboard | Faculty workload and subject pass-rate arrays are not supplied by the adapter/backend path |
| AI search | `searchKnowledge` sends the wrong body shape |
| Messages | Conversation enum uses ANNOUNCEMENT rather than DEPARTMENT_ANNOUNCEMENT |

## API contract mismatches to fix together

| Frontend contract | Backend contract | Result |
|---|---|---|
| Attendance `getSession(): AttendanceSession` | Backend returns an array | UI/type mismatch |
| Attendance submit `{success,count}` | `{sessionId,created,skippedAlreadyMarked}` | False generic success message |
| Attendance filter `subjectOfferingId` | Backend query uses `subjectId` | Filter ignored |
| Attendance shortage flat percentage/name | `{ id, rollNumber, user, overall, flags }` | At-risk cards show generic names/0% |
| Fee `amount` / `paidAmount` | `amountDue` / `amountPaid` | Incorrect fee totals/status |
| Scholarship flat object | `{ scholarship, match }` | Generic cards/missing IDs |
| Placement `INTERVIEWING` / `IN_PERSON` | `INTERVIEW` / `ONSITE` | Invalid requests |
| Scholarship categories MERIT/SPORTS/etc. | GOVERNMENT/COLLEGE/PRIVATE | Validation failures |
| Student gender PREFER_NOT_TO_SAY | UNDISCLOSED | Validation failure |
| Portfolio PUBLICATION/INTERNSHIP/COMPETITION | CERTIFICATION/PROJECT/ACHIEVEMENT | Validation failure |
| Complaint URGENT/IN_PROGRESS | CRITICAL/INVESTIGATING | Validation failure |
| Document POLICY/STUDENT_ONLY | REGULATION/STUDENTS (etc.) | Validation failure |
| AI search `{query,limit}` | `{question,...filters}` | Validation failure |
| Analytics risk array | `{note,students}` | Empty list |
| Notice `published` / attachments objects | `publishedAt` / `attachmentKeys` | Missing status/attachments |

## False or misleading data fallbacks

The following should not be used as production data:
- fixed academic year and semester defaults
- fabricated scholarship amount of 25,000
- fabricated placement CTC of 8.5 LPA
- fabricated placement match score of 92
- generic branch/skills/interview-round fallbacks
- fabricated complaint timeline and desk labels
- generic document size/type/year values
- fixed CSE batch rank statement
- fixed B.Tech CSE Semester 6 admit-card header
- success receipt text and fixed receipt number

A missing backend field should render as “Not available” or a clear empty state, not a fabricated value.

## Role mapping

The backend defines more roles than the frontend user model/normalizer. PARENT, EXAM_CONTROLLER, SUPPORT_STAFF, and LIBRARY_STAFF are not reliably represented and can fall back to STUDENT. The frontend also chooses one role for navigation rather than preserving all assigned roles/permissions.

**Fix recommendation:** generate frontend API and role contracts from the backend OpenAPI document, and add integration tests that run against a real Nest API rather than hand-written mock payloads.
