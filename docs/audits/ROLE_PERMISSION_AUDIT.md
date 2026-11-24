# Role & Permission Integration Audit

**Date:** 2026-11-24 16:52:28  
**Auditor:** Security & Access Control Reviewer  
**Scope:** Permissions Matrix (`Backend/src/auth/permissions.ts`), Guards, Frontend Role Normalization  

---

## 1. Executive Summary

This audit verified role-based access control (RBAC), department-level scoping for HODs, secondary role modeling, and multi-tenant isolation.

---

## 2. Role Boundaries & Verification Matrix

| Role | Navigation Access | Allowed Mutations | Denied Operations |
|---|---|---|---|
| **STUDENT** | Student Portal (Fees, Attendance, Assignments, Exams, Complaints) | Submit assignments, pay fees, lodge grievances | Access other students' data, mark attendance, grade assignments |
| **TEACHER** | Teacher Portal (Roll Call, Assignments, Gradebook) | Mark attendance for taught offerings, create assignments, grade submissions | Manage outside departments, approve department leaves |
| **HOD** | HOD Portal (Dept Analytics, Leave Approvals, Corrections) | Approve leave requests for department faculty, approve attendance corrections | Access outside departments, global tenant settings |
| **COLLEGE_ADMIN** | Admin Portal (Users, Academics, Fees, Campuses) | Onboard users, manage fee structures, publish notices | Super-admin platform-global operations |
| **EXAM_CONTROLLER** | Examination Controller Portal | Schedule exams, enter and publish exam results | Unrelated administrative settings |
| **ACCOUNTANT** | Finance & Fee Collection Desk | Record counter payments, adjust fee structures | Grade academic submissions |
