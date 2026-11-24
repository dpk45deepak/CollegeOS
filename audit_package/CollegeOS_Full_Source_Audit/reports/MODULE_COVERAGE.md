# Module and Route Coverage Matrix

## Backend

| Module/domain | Coverage |
|---|---|
| auth | Core controller/service/DTO/security paths reviewed |
| access / tenancy | Core guards, principal, ownership, and scope paths reviewed |
| RBAC / users | Core role/permission and user service paths reviewed |
| academic | Core controller/service/DTO paths reviewed |
| students | Core controller/service/DTO paths reviewed |
| teachers | Core controller/service/DTO paths reviewed |
| attendance | Core controller/service/analytics/DTO paths reviewed |
| assignments | Core controller/service/DTO paths reviewed |
| examinations | Core controller/service/grading/DTO paths reviewed |
| timetable | Core controller/service/DTO paths reviewed |
| fees | Core controller/service/gateway/DTO paths reviewed |
| scholarships | Core controller/service/eligibility paths reviewed |
| placements | Core controller/service/matching paths reviewed |
| complaints | Core controller/service/workflow/DTO paths reviewed |
| campus / notices / events | Core controller/service/DTO paths reviewed |
| messaging | Core service/policy/controller paths reviewed |
| notifications | Service/policy/channel paths partially reviewed |
| documents / RAG | Core service/visibility/processor/retrieval paths reviewed |
| storage | Core service/controller/module/validation paths reviewed |
| analytics | Core service/controller/risk paths reviewed |
| reports | Core service/controller paths reviewed |
| search | Service/controller partially reviewed |
| portal | Service/controller partially reviewed |
| admin queues | Controller reviewed |
| redis / queue | Core service/module paths reviewed |
| health / config | Main config and health paths partially reviewed |
| AI agents/tools | Core chat/RAG/tool paths partially reviewed |
| Prisma | All 63 model definitions summarized; migration and hardening SQL inspected |
| tests | Test inventory and selected tests reviewed; tests not executed |

## Frontend routes

There are 37 `page.tsx` route files in the repository snapshot. All route files were inventoried and pattern-scanned; high-risk workflows were manually inspected in more depth.

| Route group / workflow | Coverage |
|---|---|
| auth: login, verify, forgot/reset | Core flows reviewed |
| admin: users | Core page reviewed |
| admin: analytics | Core page and API adapter reviewed |
| admin: AI observability | Core page and adapter reviewed |
| student: attendance | Core page and API adapter reviewed |
| student: complaints | Core page and API adapter reviewed |
| student: fees | Core page and API adapter reviewed |
| student: assignments | Core page and API adapter reviewed |
| student: exams/results | Core pages and adapter reviewed |
| student: scholarships/placements | Adapter and route patterns reviewed |
| student: timetable/AI | Partial |
| teacher: attendance | Core page and API adapter reviewed |
| teacher: assignments | Core page and API adapter reviewed |
| teacher: dashboard/students | Adapter and route patterns reviewed |
| HOD dashboard | Core page and API adapter reviewed |
| documents | Core page and API adapter reviewed |
| notices | Partial |
| messages | API contract and service reviewed; page partial |
| profile/settings/general pages | Inventory/pattern scan; not every component deeply reviewed |

## Important limitation

This matrix is intentionally honest: inventory/pattern scanning is not the same as line-by-line semantic review of every leaf component. Runtime behavior is not certified. Use this report as a prioritized engineering audit, not as a guarantee that no additional bugs remain.
