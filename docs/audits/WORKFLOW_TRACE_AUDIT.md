# End-to-End Workflow Execution Trace Audit

**Date:** 2026-11-24 16:52:28  
**Auditor:** Principal Full-Stack QA Engineer  
**Scope:** Complete Execution Traces Across 5 Core Workflows  

---

## 1. Workflow 1: Student Fee Payment & Receipt Generation

```
User: Student clicks "Pay Outstanding Fee"
  ↓
Frontend: `StudentFeesPage` initiates payment with amount
  ↓
Client: `studentApi.payFee(amount, feeId)` invokes `POST /fees/:id/payments`
  ↓
Backend: `FeesController.initiatePayment` validates student ownership
  ↓
Database: Persists Payment record in `PENDING` state with gatewayRef
  ↓
Webhook: Gateway delivers signed settlement event to `/webhooks/payments/:gateway`
  ↓
Backend: `FeesService.handleWebhook` validates signature and amount match
  ↓
Database: Transactionally updates Payment to `SUCCESS` and decreases StudentFee balance
  ↓
Frontend: User clicks "Download Receipt" -> calls `GET /fees/payments/:id/receipt`
  ↓
Backend: `FeesService.receipt` verifies payment status and generates signed receipt data
  ↓
User Result: Cryptographically verified receipt rendered with zero fabricated values. (VERIFIED)
```

---

## 2. Workflow 2: Student Assignment Submission & Grading

```
User: Student uploads assignment PDF and submits
  ↓
Frontend: `StudentAssignmentsPage` uploads file via `storageApi.uploadAttachment(file)`
  ↓
Storage: Returns durable storage key `result.key`
  ↓
Client: `studentApi.submitAssignment(asgId, { fileKeys: [result.key] })` invokes `POST /assignments/:id/submit`
  ↓
Backend: `AssignmentsController.submit` validates enrollment in subject offering
  ↓
Database: Upserts `Submission` record with storage key, timestamp, and `SUBMITTED` status
  ↓
Teacher: Navigates to `TeacherAssignmentsPage` -> sees pending submission
  ↓
Teacher: Submits grade and rubric feedback -> calls `POST /assignments/submissions/:id/grade`
  ↓
Backend: Validates teacher manages offering and marks are in range `[0, maxMarks]`
  ↓
Database: Updates `Submission` status to `GRADED` and emits `AssignmentGraded` domain event
  ↓
User Result: Student immediately sees graded score and remarks upon refresh. (VERIFIED)
```
