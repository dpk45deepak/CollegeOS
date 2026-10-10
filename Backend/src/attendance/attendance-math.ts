import { AttendanceStatus } from '@prisma/client';

export interface StatusCounts {
  present: number;
  late: number;
  absent: number;
  excused: number;
}
export type AttendanceHealth = 'NO_DATA' | 'OK' | 'WARNING' | 'SHORTAGE';

export const WARNING_BUFFER = 5; // percentage points above the threshold that count as "approaching"

export const emptyCounts = (): StatusCounts => ({ present: 0, late: 0, absent: 0, excused: 0 });

export function addStatus(c: StatusCounts, s: AttendanceStatus, n = 1): void {
  if (s === 'PRESENT') c.present += n;
  else if (s === 'LATE') c.late += n;
  else if (s === 'ABSENT') c.absent += n;
  else c.excused += n;
}

/** PRESENT and LATE count as attended; EXCUSED sessions are removed from the denominator. */
export function attendedAndTotal(c: StatusCounts): { attended: number; total: number } {
  const attended = c.present + c.late;
  return { attended, total: attended + c.absent };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function percentage(attended: number, total: number): number | null {
  return total === 0 ? null : round2((attended * 100) / total);
}

/** Smallest number of *consecutive future classes attended* needed to reach `threshold`%. null = unreachable. */
export function classesNeeded(attended: number, total: number, threshold: number): number | null {
  if (total === 0) return 0;
  if ((attended * 100) / total >= threshold) return 0;
  if (threshold >= 100) return null;
  return Math.ceil((threshold * total - 100 * attended) / (100 - threshold));
}

/** How many future classes can still be missed while staying at/above the threshold. */
export function classesCanMiss(attended: number, total: number, threshold: number): number {
  if (total === 0 || threshold <= 0) return 0;
  const m = Math.floor((100 * attended - threshold * total) / threshold);
  return Math.max(0, m);
}

export function health(pct: number | null, threshold: number): AttendanceHealth {
  if (pct === null) return 'NO_DATA';
  if (pct < threshold) return 'SHORTAGE';
  if (pct < threshold + WARNING_BUFFER) return 'WARNING';
  return 'OK';
}

export interface WindowStats {
  attended: number;
  total: number;
}
/** Flags a sudden drop: recent window is `minDrop` points worse than the window before it. */
export function suddenDecline(recent: WindowStats, previous: WindowStats, minDrop = 15, minSessions = 5): boolean {
  if (recent.total < minSessions || previous.total < minSessions) return false;
  const r = (recent.attended * 100) / recent.total;
  const p = (previous.attended * 100) / previous.total;
  return p - r >= minDrop;
}

/** Statuses newest-first → length of the current run of ABSENT. */
export function consecutiveAbsences(statusesNewestFirst: AttendanceStatus[]): number {
  let n = 0;
  for (const s of statusesNewestFirst) {
    if (s === 'ABSENT') n++;
    else if (s === 'EXCUSED') continue;
    else break;
  }
  return n;
}

export interface SubjectAttendance {
  subjectId: string;
  subjectName?: string;
  attended: number;
  total: number;
  percentage: number | null;
  health: AttendanceHealth;
  classesNeeded: number | null;
  canMiss: number;
}

export function summarise(
  subjectId: string,
  counts: StatusCounts,
  threshold: number,
  subjectName?: string,
): SubjectAttendance {
  const { attended, total } = attendedAndTotal(counts);
  const pct = percentage(attended, total);
  return {
    subjectId,
    subjectName,
    attended,
    total,
    percentage: pct,
    health: health(pct, threshold),
    classesNeeded: pct !== null && pct < threshold ? classesNeeded(attended, total, threshold) : 0,
    canMiss: classesCanMiss(attended, total, threshold),
  };
}
