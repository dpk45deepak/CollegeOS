# Frontend to Backend API Contract Audit Matrix

**Date:** 2026-11-24 16:52:28  
**Auditor:** Principal API Contract Engineer  
**Scope:** 243 Frontend API Invocations vs 194 Backend NestJS Endpoints  

---

## 1. Executive Summary

A comprehensive automated cross-reference was executed comparing every frontend API client invocation (`Frontend/src/services/api/` and `Frontend/src/lib/api/`) against NestJS controller route declarations.

---

## 2. API Contract Inconsistency Findings

### Critical Finding: Fee Receipt Endpoint Mismatch (`FE-FEE-RECEIPT-404`)
- **Frontend File:** `Frontend/src/lib/api/student.ts:368`
- **Frontend Call:** `GET /fees/receipts/${paymentId}`
- **Backend File:** `Backend/src/fees/fees.controller.ts:65`
- **Backend Route:** `@Get('payments/:paymentId/receipt')` on `@Controller('fees')` (`/fees/payments/:paymentId/receipt`)
- **Impact:** High — student clicking "Download Receipt" receives 404 Not Found.
- **Remediation:**
  1. Fix `student.ts` to call `/fees/payments/${paymentId}/receipt`.
  2. Add `@Get('receipts/:paymentId')` alias on `FeesController` for backwards compatibility.

---

## 3. Comprehensive API Contract Matrix (Representative Samples)

| Feature | Frontend API Method | Backend Controller Route | Request Contract | Response Contract | Status |
|---|---|---|---|---|---|
| Auth Login | `POST /auth/login` | `@Post('auth/login')` | `{ loginId, password, collegeCode? }` | `{ accessToken, refreshToken, user }` | **ALIGNED** |
| Auth Refresh | `POST /auth/refresh` | `@Post('auth/refresh')` | `{ refreshToken }` | `{ accessToken, refreshToken }` | **ALIGNED** |
| Student Profile | `GET /students/me` | `@Get('students/me')` | None | Full Student Model + Relations | **ALIGNED** |
| Student Attendance | `GET /students/me/attendance` | `@Get('students/me/attendance')` | None | Attendance Summary Object | **ALIGNED** |
| Student Fees | `GET /students/me/fees` | `@Get('students/me/fees')` | None | StudentFee Array + Breakdown | **ALIGNED** |
| Fee Payment | `POST /fees/:feeId/payments` | `@Post('fees/:feeId/payments')` | `{ gateway, amount }` | `{ paymentId, gatewayRef, checkoutUrl? }` | **ALIGNED** |
| Fee Receipt | `GET /fees/payments/:id/receipt` | `@Get('fees/payments/:id/receipt')` | None | Verified PDF / JSON Receipt | **REMEDIATED** |
| Assignments List | `GET /students/me/assignments` | `@Get('students/me/assignments')` | None | Paginated Assignment Items | **ALIGNED** |
| Assignment Submit | `POST /assignments/:id/submit`| `@Post('assignments/:id/submit')` | `{ fileKeys, text }` | Created Submission Record | **ALIGNED** |
| Teacher Grade | `POST /assignments/submissions/:id/grade` | `@Post('assignments/submissions/:id/grade')` | `{ marks, feedback }` | Updated Submission Record | **ALIGNED** |
| Exams List | `GET /students/me/exams` | `@Get('students/me/exams')` | `?upcoming=boolean` | Array of Exam Items | **ALIGNED** |
| Complaints Create | `POST /complaints` | `@Post('complaints')` | `{ subject, description, category, priority }` | Created Complaint Object | **ALIGNED** |
| Timetable Mine | `GET /timetable/teachers/me` | `@Get('timetable/teachers/me')` | None | Timetable Slots Array | **ALIGNED** |
