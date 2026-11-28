-- Single-date lecture exceptions (CANCELLED, RESCHEDULED, SUBSTITUTED)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TimetableExceptionType') THEN
    CREATE TYPE "TimetableExceptionType" AS ENUM ('CANCELLED', 'RESCHEDULED', 'SUBSTITUTED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "TimetableException" (
  "id" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "type" "TimetableExceptionType" NOT NULL,
  "substituteTeacherId" TEXT,
  "overrideRoomId" TEXT,
  "overrideStartMinute" INTEGER,
  "overrideEndMinute" INTEGER,
  "reason" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TimetableException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimetableException_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TimetableException_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TimetableException_substituteTeacherId_fkey" FOREIGN KEY ("substituteTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "TimetableException_overrideRoomId_fkey" FOREIGN KEY ("overrideRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TimetableException_slotId_date_key" ON "TimetableException"("slotId", "date");
CREATE INDEX IF NOT EXISTS "TimetableException_collegeId_date_idx" ON "TimetableException"("collegeId", "date");
CREATE INDEX IF NOT EXISTS "TimetableException_substituteTeacherId_date_idx" ON "TimetableException"("substituteTeacherId", "date");
