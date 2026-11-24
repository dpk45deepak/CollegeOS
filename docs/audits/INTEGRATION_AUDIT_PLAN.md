# Full-Stack Bug, API Integration & State Consistency Audit Plan

**Date:** 2026-11-24  
**Auditor:** Principal Full-Stack Engineer, Senior Backend Architect, Frontend State Management Specialist, Database Engineer, Security Reviewer & QA Lead  
**Scope:** Complete CollegeOS Repository (`Frontend/`, `Backend/`, `Backend/prisma/`, `.agents/`)  
**Methodology:** Evidence-driven scientific root-cause tracing (/debugging-and-root-cause-analysis)

---

## 1. Repository Discovery & Baseline Architecture

### 1.1 Technical Stack & Frameworks
| Layer | Technology / Framework | Versions & Tooling |
|---|---|---|
| **Frontend Framework** | Next.js (App Router), React 19 | `next@15.1.11`, `react@^19.0.0`, `react-dom@^19.0.0` |
| **State Management** | Zustand, TanStack React Query, React State | `zustand@^5.0.3`, `@tanstack/react-query@^5.62.7` |
| **Styling & UI** | Tailwind CSS, Lucide React, Radix primitives | `tailwind-merge@^3.0.1`, `clsx@^2.1.1`, `lucide-react@^0.475.0` |
| **Forms & Validation** | React Hook Form, Zod | `react-hook-form@^7.54.2`, `zod@^3.24.2` |
| **Frontend Test Tooling**| Vitest | `vitest@^3.2.7` (4 suites, 18 tests passing) |
| **Backend Framework** | NestJS | `@nestjs/core@^10.4.15`, Express, TypeScript |
| **ORM & Database** | Prisma ORM, PostgreSQL (pgvector) | `@prisma/client@^5.22.0`, PostgreSQL 16 |
| **Cache & Realtime** | Redis (ioredis), Socket.IO (BullMQ) | `ioredis@^5.4.2`, `@nestjs/bullmq@^10.2.3`, `socket.io@^4.8.1` |
| **Security & Auth** | Passport JWT, bcryptjs, Helmet, Pino | `@nestjs/jwt@^10.2.0`, `bcryptjs@^2.4.3`, `helmet@^8.0.0` |
| **Backend Test Tooling**| Jest, Supertest | `jest@^29.7.0` (27 suites, 156 tests passing) |

### 1.2 Discovered Inventory Metrics
- **Frontend Routes:** 37 distinct App Router page/route definitions across student, teacher, HOD, and admin portals.
- **Frontend API Client Calls:** 243 discrete endpoint invocations across `Frontend/src/services/api/` and `Frontend/src/lib/api/`.
- **Backend Controller Endpoints:** 194 REST endpoints across 20+ NestJS controllers.
- **Prisma Database Models:** 63 relational models in `Backend/prisma/schema.prisma`.

### 1.3 Installed Skills Discovery
- `production-code-review`: Available and active.
- `senior-software-architect`: Available and active.
- `debugging-and-root-cause-analysis`: Available and active.
- `frontend-engineering`: Available and active.
- `backend-engineering`: Available and active.
- `api-contract-engineer`: Available and active.
- `database-architect`: Available and active.
- `application-security`: Available and active.
- `test-engineering`: Available and active.

*Report:* All 9 requested specialist skills are installed and available.

---

## 2. Audit Phases & Execution Strategy

```
Phase 1: Repository Discovery & Planning (Current)
   ↓
Phase 2: Frontend Component & State Management Deep Dive (React 19, Zustand, Query keys)
   ↓
Phase 3: Frontend to Backend API Contract Verification (194 Endpoints vs 243 API Calls)
   ↓
Phase 4: Backend Business Logic, Guards & Transaction Audit (Idempotency, Race Conditions)
   ↓
Phase 5: Database & Persistence Consistency Audit (Relations, Cascades, Nullability)
   ↓
Phase 6: Role & Permission Boundary Audit (Multi-role, Secondary Roles, Tenant Scopes)
   ↓
Phase 7: End-to-End Workflow Execution Traces (Attendance, Assignments, Fees, Exams, Grievances)
   ↓
Phase 8: Automated Regression Testing (Vitest, Jest, Supertest)
   ↓
Phase 9 & 10: Bug Classification, Root Cause Identification & Safe Remediations
   ↓
Phase 11: Final Integration Audit Reports Generation
```

---

## 3. Workstream Checklists & Priority Targets

### Workstream A: Frontend State & Lifecycle
- React Query invalidation mismatches (e.g., query keys `student_assignments` vs `assignments`).
- Stale closures in event handlers and `useMutation` callbacks.
- Form reset in modals upon closing/re-opening.
- Optimistic update rollback handling.
- URL parameter synchronization with filters and pagination.

### Workstream B: API Contract Matrix
- Field name mismatches between frontend adapters and backend DTOs.
- Response envelope unwrapping (`{ success: true, data: ... }` vs direct array/object).
- Query parameter boolean parsing (e.g. `upcoming=false` string handling).
- Date and timestamp parsing across calendar timezones.

### Workstream C: Backend Logic & Concurrency
- Idempotency in payment webhooks and status mutations.
- Atomicity in multi-record operations (attendance marking, exam results publishing).
- Safe error propagation without leaking sensitive internal stack traces.

### Workstream D: Role Scopes & Database Constraints
- Department boundaries for HODs vs ordinary teachers.
- Secondary role recognition in navigation and layout guards.
- Foreign key and unique constraint enforcement in forward-only migrations.
