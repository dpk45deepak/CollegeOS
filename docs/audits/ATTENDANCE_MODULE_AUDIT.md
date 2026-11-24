# Attendance Module Source Audit & Reengineering Plan

**Date:** 2026-11-24  
**Scope:** Backend Domain Models, Timetable Integration, Attendance Status Invariants, Frontend Portals  

---

## 1. Complete Entity-to-Action Mapping

| Backend Entity | API Endpoint | Frontend API Client | UI Component | User Action | Current Status / Mismatch |
|---|---|---|---|---|---|
| `TimetableSlot` | `GET /timetable/teachers/me` | `teacherApi.getTodayClasses` | `TeacherDashboardPage` | View today's schedule | **Mismatch:** Timetable slots were mapped without date parameter or marked state. |
| `TimetableSlot` + `AttendanceSession` | *Missing* -> `GET /attendance/teacher/scheduled-sessions` | `attendanceApi.getTeacherScheduledSessions` | `TeacherAttendancePage` | Select scheduled lecture | **Mismatch:** Teacher UI previously used hardcoded `"LEC_1"` with no timetable slot binding. |
| `Enrollment` | `GET /subject-offerings/:id/students` -> `GET /attendance/scheduled-sessions/:slotId/roster` | `attendanceApi.getScheduledSessionRoster` | `TeacherAttendancePage` | View student roster | **Mismatch:** Roster lacked session-specific marked status indicators. |
| `Attendance` | `POST /attendance` | `attendanceApi.mark` | `TeacherAttendancePage` | Submit attendance | **Mismatch:** Status enum contained `EXCUSED`; needed strict `PRESENT`, `ABSENT`, `LATE`. |
| `AttendanceCorrection` | `POST /attendance/correction-request` | `attendanceApi.requestCorrection` | `StudentAttendancePage` | Submit attendance dispute / issue | **Mismatch:** Student portal used general complaint instead of direct correction request. |
| `AttendanceCorrection` | `GET /attendance/corrections` | `attendanceApi.listCorrections` | `StudentAttendancePage` / `TeacherAttendancePage` / `HodDashboardPage` | Track issues | **Mismatch:** Scoping did not allow student to view own issues, nor teacher to review student issues. |
| `AttendanceCorrection` | `POST /attendance/corrections/:id/review` | `attendanceApi.reviewCorrection` | `TeacherAttendancePage` / `HodDashboardPage` | Approve/Reject issue | **Aligned** |

---

## 2. Identified Inconsistencies & Remediation Blueprint

1. **Status Set Violation:**
   - Requirement: Support strictly `PRESENT`, `ABSENT`, `LATE`.
   - Finding: `enum AttendanceStatus` in Prisma had `EXCUSED`.
   - Plan: Forward-compatible PostgreSQL migration converting any `EXCUSED` to `ABSENT`, removing `EXCUSED` from Prisma enum, updating math helper, and regenerating client.

2. **Absence of Timetable-Driven Session API:**
   - Finding: No endpoint returned a teacher's scheduled lectures for a given date with attendance marked flags.
   - Plan: Implement `GET /attendance/teacher/scheduled-sessions?date=...` and `GET /attendance/scheduled-sessions/:slotId/roster?date=...`.

3. **Attendance Issues Workflow Disconnect:**
   - Finding: `requestCorrection` in `AttendanceService` required offering ownership, preventing students from disputing their own records.
   - Plan: Allow students to dispute their own attendance records (`att.studentId === p.studentId`), add `P.ATTENDANCE_CORRECT_REQUEST` to `STUDENT` permissions, and allow teachers and HODs to review student disputes with notes.

4. **Frontend Manual Inputs:**
   - Finding: `TeacherAttendancePage` had period selector defaulting to `"LEC_1"` and no timetable slot selection.
   - Plan: Redesign `TeacherAttendancePage` to load scheduled sessions dynamically from the backend timetable for the selected date.
