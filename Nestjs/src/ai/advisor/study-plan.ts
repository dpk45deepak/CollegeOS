export interface PlanInput {
  exams: { subject: string; subjectId: string; daysAway: number }[];
  subjects: {
    subjectId: string;
    name: string;
    examAvgPct: number | null;
    weak: boolean;
    weakReasons: string[];
    attendancePct: number | null;
  }[];
  overallExamAvg: number | null;
  attendanceFlags: { type: string; subjectName?: string; detail: string }[];
  pendingAssignments: { title: string; subject: string; dueInDays: number }[];
}
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export interface Recommendation {
  type: 'EXAM_PREP' | 'WEAK_SUBJECT' | 'ATTENDANCE' | 'DEADLINE';
  priority: Priority;
  text: string;
  basedOn: string[];
  subject?: string;
}

const bucket = (score: number): Priority => (score >= 55 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW');

/**
 * Deterministic study plan. Every recommendation lists the college facts it is based on (`basedOn`) so the UI can
 * show "college data" and "AI/rule-generated suggestion" separately. No topic/unit claims are made without data.
 */
export function buildStudyPlan(i: PlanInput): Recommendation[] {
  const recs: (Recommendation & { score: number })[] = [];
  const bySubject = new Map(i.subjects.map((s) => [s.subjectId, s]));

  for (const e of i.exams.filter((x) => x.daysAway <= 30)) {
    const s = bySubject.get(e.subjectId);
    const urgency = (Math.max(0, 30 - e.daysAway) / 30) * 60;
    const gap = s?.examAvgPct != null && i.overallExamAvg != null ? Math.max(0, i.overallExamAvg - s.examAvgPct) : 0;
    const weakness = Math.min(30, gap * 1.5) + (s?.weak ? 10 : 0);
    const score = urgency + weakness;
    const basedOn = [`${e.subject} exam in ${e.daysAway} day(s)`];
    let text = `${e.subject}: exam in ${e.daysAway} day(s).`;
    if (s?.examAvgPct != null) {
      basedOn.push(`your ${e.subject} average is ${s.examAvgPct}%`);
      if (gap >= 5) {
        basedOn.push(`overall average ${i.overallExamAvg}%`);
        text += ` Your recent average here (${s.examAvgPct}%) is below your overall average (${i.overallExamAvg}%) — give this subject extra time and revisit the questions you lost marks on.`;
      } else text += ' Keep revising regularly and attempt past papers.';
    } else text += ' No published marks yet — start with the syllabus and past papers.';
    recs.push({ type: 'EXAM_PREP', priority: bucket(score), text, basedOn, subject: e.subject, score });
  }
  const examSubjects = new Set(i.exams.map((e) => e.subjectId));
  for (const s of i.subjects.filter((x) => x.weak && !examSubjects.has(x.subjectId))) {
    recs.push({
      type: 'WEAK_SUBJECT',
      priority: 'MEDIUM',
      text: `${s.name} needs attention: ${s.weakReasons.join('; ')}.`,
      basedOn: s.weakReasons,
      subject: s.name,
      score: 30,
    });
  }
  for (const f of i.attendanceFlags.filter(
    (x) => x.type === 'BELOW_THRESHOLD' || x.type === 'APPROACHING_SHORTAGE' || x.type === 'REPEATED_SUBJECT_ABSENCE',
  )) {
    recs.push({
      type: 'ATTENDANCE',
      priority: f.type === 'BELOW_THRESHOLD' ? 'HIGH' : 'MEDIUM',
      text: `Attendance${f.subjectName ? ` in ${f.subjectName}` : ''}: ${f.detail}.`,
      basedOn: [f.detail],
      subject: f.subjectName,
      score: f.type === 'BELOW_THRESHOLD' ? 70 : 40,
    });
  }
  for (const a of i.pendingAssignments.filter((x) => x.dueInDays <= 7).sort((x, y) => x.dueInDays - y.dueInDays)) {
    recs.push({
      type: 'DEADLINE',
      priority: a.dueInDays <= 2 ? 'HIGH' : 'MEDIUM',
      text: `"${a.title}" (${a.subject}) is due ${a.dueInDays <= 0 ? 'now' : `in ${a.dueInDays} day(s)`} and not yet submitted.`,
      basedOn: [`${a.title} due in ${a.dueInDays} day(s)`],
      subject: a.subject,
      score: a.dueInDays <= 2 ? 65 : 35,
    });
  }
  return recs.sort((a, b) => b.score - a.score).map(({ score: _s, ...r }) => r);
}
