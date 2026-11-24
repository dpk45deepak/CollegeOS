-- Safe forward migration: ensure any historical EXCUSED records are converted to ABSENT
UPDATE "Attendance" SET status = 'ABSENT' WHERE status::text = 'EXCUSED';
UPDATE "AttendanceCorrection" SET "oldStatus" = 'ABSENT' WHERE "oldStatus"::text = 'EXCUSED';
UPDATE "AttendanceCorrection" SET "newStatus" = 'ABSENT' WHERE "newStatus"::text = 'EXCUSED';

-- Alter enum AttendanceStatus to remove EXCUSED
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LATE');
ALTER TABLE "Attendance" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TABLE "AttendanceCorrection" ALTER COLUMN "oldStatus" TYPE "AttendanceStatus_new" USING ("oldStatus"::text::"AttendanceStatus_new");
ALTER TABLE "AttendanceCorrection" ALTER COLUMN "newStatus" TYPE "AttendanceStatus_new" USING ("newStatus"::text::"AttendanceStatus_new");
DROP TYPE "AttendanceStatus";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
