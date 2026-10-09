# Product Roadmap

This roadmap describes a recommended implementation order. It is not a statement that the features are already complete. Track actual status in issues or project boards.

## Phase 0 — Foundation

- [ ] Define product scope and role permissions.
- [ ] Create monorepo or clearly separated frontend/backend repositories.
- [ ] Configure TypeScript, linting, formatting, and CI.
- [ ] Add NestJS, Next.js, PostgreSQL, Prisma, and local development setup.
- [ ] Add structured logging, health checks, environment validation, and Swagger.

**Exit criteria:** a developer can run the project locally from documented steps.

## Phase 1 — Identity and institution setup

- [ ] Authentication and session management.
- [ ] Roles, permissions, and resource-level authorization.
- [ ] College/tenant context and isolation tests.
- [ ] Departments, programs, academic years, batches, semesters, and sections.
- [ ] Safe development seed data.

**Exit criteria:** users see only the tenant and resources they are authorized to access.

## Phase 2 — Core academic workflows

- [ ] Student and teacher profiles.
- [ ] Subjects and enrollment.
- [ ] Timetable and conflict validation.
- [ ] Lecture-wise attendance and summaries.
- [ ] Attendance correction request and approval workflow.
- [ ] Assignments, submissions, exams, and results.

**Exit criteria:** core student and teacher journeys work end to end with tests.

## Phase 3 — Student services and communication

- [ ] Complaints and assignment/escalation workflow.
- [ ] Notices and notifications.
- [ ] Fees and receipts through a secure payment integration, if required.
- [ ] Scholarship listings and applications.
- [ ] Placement drives and applications.
- [ ] Real-time updates where they materially improve UX.

**Exit criteria:** students can complete high-value workflows without manual workarounds.

## Phase 4 — Intelligence and analytics

- [ ] Attendance shortage and trend rules.
- [ ] Academic and operational dashboards.
- [ ] Deadline and escalation jobs.
- [ ] Explainable rule-based insights before predictive ML.
- [ ] Reports and exports with permission checks.

**Exit criteria:** insights are traceable to reliable data and are not presented as guaranteed predictions.

## Phase 5 — College Knowledge RAG

- [ ] Secure document upload and storage.
- [ ] Text extraction and page metadata.
- [ ] Chunking and embeddings.
- [ ] pgvector retrieval with metadata filters.
- [ ] Source citations and unanswerable-question behavior.
- [ ] Cross-tenant and document-permission tests.
- [ ] Evaluation dataset for retrieval and answer quality.

**Exit criteria:** answers cite accessible source material and cannot retrieve unauthorized documents.

## Phase 6 — AI tools and workflow assistance

- [ ] Provider abstraction.
- [ ] Tool registry with schemas and permission checks.
- [ ] Live data tools for attendance, timetable, assignments, and complaints.
- [ ] AI-assisted grievance drafting with user confirmation.
- [ ] Scholarship and placement discovery.
- [ ] AI usage, latency, error, and cost telemetry.

**Exit criteria:** AI actions use normal domain services and cannot bypass authorization.

## Phase 7 — Production hardening

- [ ] Load and performance testing.
- [ ] Security review and dependency scanning.
- [ ] Backup and restore drill.
- [ ] Observability and alerting.
- [ ] Accessibility and mobile usability review.
- [ ] Deployment and rollback documentation.
- [ ] Data retention and privacy review.

**Exit criteria:** operational ownership, recovery, and security practices are documented and tested.

## Prioritization rule

Prefer features that solve a frequent, painful problem for a clearly identified user. Ship a complete, secure vertical slice before adding another module. Do not introduce microservices or autonomous agents unless a demonstrated requirement justifies their operational cost.
