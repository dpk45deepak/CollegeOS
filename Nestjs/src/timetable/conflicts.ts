import { DayOfWeek } from '@prisma/client';

export interface SlotLike {
  id?: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  sectionId: string;
  teacherId: string;
  roomId?: string | null;
  validFrom: Date;
  validTo?: Date | null;
}
export interface Availability {
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
}
export type ConflictType = 'SECTION' | 'TEACHER' | 'ROOM' | 'TEACHER_UNAVAILABLE';
export interface Conflict {
  type: ConflictType;
  withSlotId?: string;
  message: string;
}

const overlapTime = (a: SlotLike, b: SlotLike) =>
  a.dayOfWeek === b.dayOfWeek && a.startMinute < b.endMinute && b.startMinute < a.endMinute;
const FAR = new Date('9999-12-31');
const overlapDates = (a: SlotLike, b: SlotLike) =>
  a.validFrom <= (b.validTo ?? FAR) && b.validFrom <= (a.validTo ?? FAR);

/** Pure conflict detector: section, teacher and room double-booking plus teacher availability windows. */
export function findConflicts(
  candidate: SlotLike,
  existing: SlotLike[],
  availability: Availability[] = [],
): Conflict[] {
  const out: Conflict[] = [];
  for (const e of existing) {
    if (e.id && e.id === candidate.id) continue;
    if (!overlapTime(candidate, e) || !overlapDates(candidate, e)) continue;
    if (e.sectionId === candidate.sectionId)
      out.push({ type: 'SECTION', withSlotId: e.id, message: 'Section already has a class at this time' });
    if (e.teacherId === candidate.teacherId)
      out.push({ type: 'TEACHER', withSlotId: e.id, message: 'Teacher is already teaching at this time' });
    if (candidate.roomId && e.roomId === candidate.roomId)
      out.push({ type: 'ROOM', withSlotId: e.id, message: 'Room is already booked at this time' });
  }
  const dayWindows = availability.filter((a) => a.dayOfWeek === candidate.dayOfWeek);
  if (
    dayWindows.length > 0 &&
    !dayWindows.some((a) => a.startMinute <= candidate.startMinute && candidate.endMinute <= a.endMinute)
  ) {
    out.push({ type: 'TEACHER_UNAVAILABLE', message: "Outside the teacher's declared availability" });
  }
  return out;
}
