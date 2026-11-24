# Full-Stack Master Bug Register & Audit Findings

**Date:** 2026-11-24 16:52:28  
**Auditor:** Principal Full-Stack Engineer  
**Status:** ALL AUDITED FINDINGS CATALOGED & REMEDIATED  

---

| Bug ID | Severity | Feature / Module | Frontend File & Line | Backend File & Line | Expected Behavior | Actual Behavior | Root Cause | Status |
|---|---|---|---|---|---|---|---|---|
| `FE-FEE-RECEIPT-404` | **HIGH** | Finance / Receipts | `Frontend/src/lib/api/student.ts:368` | `Backend/src/fees/fees.controller.ts:65` | `GET /fees/payments/:id/receipt` returns verified receipt | Returns 404 Not Found | Mismatched path `/fees/receipts/:id` | **REMEDIATED** |
| `FE-ANA-DEPT-INERT` | **MEDIUM** | Analytics Dashboard | `Frontend/src/app/(admin)/admin/analytics/page.tsx:34` | `Backend/src/analytics/analytics.controller.ts:45` | Department dropdown filters analytics charts | Charts remain unfiltered | `deptFilter` state not wired to chart series | **REMEDIATED** |
| `FE-ATT-DISPUTE-CAT` | **MEDIUM** | Attendance Grievance | `Frontend/src/app/(student)/student/attendance/page.tsx:46` | `Backend/prisma/schema.prisma:180` | Grievance submitted under `ATTENDANCE` category | Submitted under `"Academic"` | Mismatched complaint category string | **REMEDIATED** |
| `FE-USER-MULTIROLE-FILTER` | **MEDIUM** | User Management | `Frontend/src/app/(admin)/admin/users/page.tsx:105` | `Backend/src/users/users.service.ts` | Multi-role users match when filtering by any of their roles | Filter matches only first role | Hardcoded index `[0]` on `userRoles` array | **REMEDIATED** |
| `FE-DASH-TEACHER-EMPTY` | **LOW** | Teacher Timetable | `Frontend/src/lib/api/teacher.ts:40` | `Backend/src/timetable/timetable.service.ts:170` | Shows today's scheduled classes from timetable | Lists all subject offerings | Did not query `/timetable/teachers/me` | **REMEDIATED** |
