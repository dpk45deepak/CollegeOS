-- Additive, backward-compatible security & performance hardening indexes.
-- Enforces uniqueness on platform-global (collegeId IS NULL) SUPER_ADMIN users and global system roles
-- across PostgreSQL versions where standard unique constraints allow multiple NULLs.

CREATE UNIQUE INDEX IF NOT EXISTS "User_null_college_loginId_uq"
  ON "User" ("loginId")
  WHERE "collegeId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_null_college_email_uq"
  ON "User" ("email")
  WHERE "collegeId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Role_null_college_key_uq"
  ON "Role" ("key")
  WHERE "collegeId" IS NULL;

-- Hot-path query indexes for student attendance, exam publishing, complaints SLA, and active auth sessions
CREATE INDEX IF NOT EXISTS "Attendance_college_student_date_idx"
  ON "Attendance" ("collegeId", "studentId", "date");

CREATE INDEX IF NOT EXISTS "ExamResult_college_status_idx"
  ON "ExamResult" ("collegeId", "status");

CREATE INDEX IF NOT EXISTS "Complaint_college_dept_status_idx"
  ON "Complaint" ("collegeId", "assignedDepartmentId", "status");

CREATE INDEX IF NOT EXISTS "AuthSession_user_revoked_idx"
  ON "AuthSession" ("userId", "revokedAt");
