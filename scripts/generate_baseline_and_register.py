import json
import os

os.makedirs('docs/engineering', exist_ok=True)

with open('findings_dump.json', 'r', encoding='utf-8') as f:
    findings = json.load(f)

# 1. Baseline Report
baseline_md = """# CollegeOS Baseline Verification Report

**Date:** 2026-11-24  
**Git Branch:** `main` (commit cb36105)  
**Evaluator:** Principal Software Architect & Multi-Agent Orchestration Team  

---

## 1. Executive Baseline Assessment

Prior to executing source-level remediation, a full baseline inspection and test execution was conducted across the CollegeOS monorepo (Backend and Frontend) and the supplied audit package (`CollegeOS_Full_Source_Audit.zip`).

### Key Repository Facts
- **Backend Framework:** NestJS 10, TypeScript 5, Prisma ORM 5.20, PostgreSQL + pgvector, Redis, BullMQ
- **Frontend Framework:** Next.js 14 (App Router), React 18, TanStack Query 5, Tailwind CSS, Lucide icons, Vitest 3.2.7
- **Total Tracked Files:** 457 tracked source files
- **Total Audit Findings:** 114 distinct findings indexed from `BUG_REGISTER.md`
  - **Critical:** 4
  - **High:** 57
  - **Medium:** 51
  - **Low:** 2

---

## 2. Baseline Test & Build Outcomes

| Target | Command | Result | Details |
|---|---|---|---|
| **Backend Typecheck** | `npm run typecheck` (`tsc --noEmit`) | **PASS** (0 errors) | Zero static compiler errors in existing codebase. |
| **Backend Unit Tests** | `npm test -- --passWithNoTests` | **PASS** (27 suites, 156 tests) | All 27 existing suites passed (time: 215s). Existing tests mock external layers. |
| **Frontend Typecheck** | `npx tsc --noEmit` | **PASS** (0 errors) | Zero static type errors in existing Next.js frontend. |
| **Frontend Tests** | `npm test` (`vitest run`) | **PASS** (4 suites, 18 tests) | 4 test files executed in 1.68s. High reliance on mocked payloads. |

---

## 3. High-Priority Confirmed Vulnerabilities (Pre-Remediation Inspection)

1. **SEC-001 (Critical):** `TenantGuard` allowed `SUPER_ADMIN` requests without `x-tenant-id` to have `req.tenantId = undefined`. Downstream Prisma queries using `{ collegeId: c }` omit undefined fields, converting tenant-scoped queries into cross-tenant queries.
2. **FIN-001 (Critical):** `FeesModule` registered `MockGateway` in production if `m.size === 0`, enabling mock transactions in production environments without real gateway credentials.
3. **FIN-002 (Critical):** `Frontend/src/app/(student)/student/fees/page.tsx` marked payments as success immediately after order generation, before external settlement.
4. **FIN-003 & FIN-004 (Critical/High):** Refunds were marked `PROCESSED` in the database without invoking external payment provider refund APIs, and concurrent refund requests lacked atomic balance checks.
5. **SEC-002 to SEC-007 (High):** Departmental and HOD scoping leaks in analytics, placement reports, leave requests, notice publishing, queue retries, and messaging.
6. **SEC-008 & DOC-001 (High):** Any user with document upload permissions could trigger reprocessing of any document across the college, bypassing uploader/admin checks.
7. **SEC-009 (High):** `NoopScanner` was wired as default malware scanner in production, accepting arbitrary uploaded files without scanning.
8. **SEC-011 (High):** WebSocket session revocation checks did not include a database fallback when Redis was offline, unlike HTTP auth.
9. **AUTH-003 & AUTH-004 (High):** Resend verification required authenticated active sessions (which unverified users lack), and student/teacher creation inside transactions silently skipped sending verification emails.
10. **DB-001 & DB-002 (High):** `StudentFee` lacked unique constraint on `(studentId, feeStructureId)`, leading to duplicate fee assignments upon reassignment.

---

## 4. Workstream Assignments & Execution Phases

- **Phase 1: Critical Security & Financial Fixes (P0)**
  - SEC-001, SEC-009, SEC-011, SEC-012, AUTH-001..AUTH-004
  - FIN-001, FIN-002, FIN-003, FIN-004, FIN-005, FIN-006, FIN-007
  - SEC-002..SEC-007, SEC-008, SEC-010
- **Phase 2: Backend & Database Correctness (P1)**
  - DATA-001..DATA-006, DB-001..DB-005
  - ATT-001..ATT-007, ASSIGN-001..ASSIGN-005, EXAM-001..EXAM-005, TIME-001..TIME-004
  - COM-001..COM-007, SCH-001..SCH-003, PLAC-001..PLAC-002, DOC-001..DOC-007
- **Phase 3: Frontend & API Contract Reconciliation (P2)**
  - FE-ROLE-001, FE-ATT-API, FE-STUDENT-001, FE-EXAM-API, FE-PLAC-API, FE-SCH-API, FE-MSG-API, FE-CAMPUS-API, FE-NOTIF-001..002, FE-DASH-001, FE-DOC-DATA
- **Phase 4: Deployment Hardening (P3)**
  - DEP-001..DEP-008, Health checks, storage resilience, Redis recovery
- **Phase 5: Full Regression Testing & Validation (P4)**
  - Integration suites, contract validation, security assertions, migration tests

"""

with open('docs/engineering/BASELINE_REPORT.md', 'w', encoding='utf-8') as f:
    f.write(baseline_md)

# 2. Master Issue Register
register_lines = [
    "# CollegeOS Master Issue Register",
    "",
    "**Generated:** 2026-11-24  ",
    "**Total Tracked Findings:** 114  ",
    "",
    "| Finding ID | Description | Severity | Verification | Owner | Files Affected | Status | Verification Level |",
    "|---|---|---|---|---|---|---|---|"
]

owner_mapping = {
    'SEC': 'Agent 2 (Security & Tenancy)',
    'AUTH': 'Agent 2 (Security & Tenancy)',
    'FIN': 'Agent 4 (Finance & Payments)',
    'DATA': 'Agent 3 (Database & Data Integrity)',
    'DB': 'Agent 3 (Database & Data Integrity)',
    'ATT': 'Agent 6 (Academic Workflows)',
    'ASSIGN': 'Agent 6 (Academic Workflows)',
    'EXAM': 'Agent 6 (Academic Workflows)',
    'TIME': 'Agent 6 (Academic Workflows)',
    'COM': 'Agent 6 (Academic Workflows)',
    'SCH': 'Agent 6 (Academic Workflows)',
    'PLAC': 'Agent 6 (Academic Workflows)',
    'AI': 'Agent 1 (Backend Architecture)',
    'ANA': 'Agent 1 (Backend Architecture)',
    'DOC': 'Agent 1 (Backend Architecture)',
    'DEP': 'Agent 7 (DevOps & Infrastructure)',
    'FE': 'Agent 5 (Frontend Integration)',
    'TEST': 'Agent 8 (QA & Regression Testing)'
}

for fid, f in findings.items():
    prefix = fid.split('-')[0]
    owner = owner_mapping.get(prefix, 'Agent 1 (Backend Architecture)')
    sev = f.get('severity', 'Medium')
    desc = f.get('title', '').replace('|', '\\|')
    ev = f.get('evidence', '').replace('`', '').replace('|', '\\|')
    register_lines.append(f"| {fid} | {desc} | {sev} | Confirmed | {owner} | {ev[:50]} | In Progress | LEVEL 0 (Inspection) |")

with open('docs/engineering/MASTER_ISSUE_REGISTER.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(register_lines) + '\n')

print("Created docs/engineering/BASELINE_REPORT.md and docs/engineering/MASTER_ISSUE_REGISTER.md")
