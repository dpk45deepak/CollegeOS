import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { pearson } from './risk';

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);

export interface SubjectPerformance {
  subjectId: string;
  name: string;
  code: string;
  examAvgPct: number | null;
  examTrend: number;
  assignmentAvgPct: number | null;
  assignmentsDue: number;
  assignmentsSubmitted: number;
  attendancePct: number | null;
  attendanceHealth: string;
  weak: boolean;
  weakReasons: string[];
}
export interface StudentPerformance {
  studentId: string;
  cgpa: number | null;
  examAvgPct: number | null;
  semesterAverages: { semester: number; avgPct: number }[];
  subjects: SubjectPerformance[];
  weakSubjects: string[];
}

@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceAnalyticsService,
  ) {}

  async forStudent(collegeId: string, studentId: string): Promise<StudentPerformance> {
    const [student, results, subs, due, att] = await Promise.all([
      this.prisma.student.findFirstOrThrow({ where: { id: studentId, collegeId }, select: { cgpa: true } }),
      this.prisma.examResult.findMany({
        where: { collegeId, studentId, status: 'PUBLISHED' },
        select: {
          marksObtained: true,
          exam: {
            select: {
              maxMarks: true,
              scheduledAt: true,
              subjectOffering: {
                select: {
                  subject: { select: { id: true, name: true, code: true } },
                  semester: { select: { number: true } },
                },
              },
            },
          },
        },
        orderBy: { exam: { scheduledAt: 'asc' } },
      }),
      this.prisma.submission.findMany({
        where: { studentId, marks: { not: null } },
        select: {
          marks: true,
          assignment: { select: { maxMarks: true, subjectOffering: { select: { subjectId: true } } } },
        },
      }),
      this.prisma.assignment.findMany({
        where: { collegeId, dueAt: { lt: new Date() }, subjectOffering: { enrollments: { some: { studentId } } } },
        select: {
          id: true,
          subjectOffering: { select: { subjectId: true, subject: { select: { name: true, code: true } } } },
          submissions: { where: { studentId }, select: { id: true } },
        },
      }),
      this.attendance.report(collegeId, studentId),
    ]);

    const subj = new Map<
      string,
      { name: string; code: string; exam: { pct: number }[]; asg: number[]; due: number; submitted: number }
    >();
    const get = (id: string, name: string, code: string) =>
      subj.get(id) ?? subj.set(id, { name, code, exam: [], asg: [], due: 0, submitted: 0 }).get(id)!;
    const semBuckets = new Map<number, number[]>();
    for (const r of results) {
      const s = r.exam.subjectOffering.subject;
      const pct = (Number(r.marksObtained) / Number(r.exam.maxMarks)) * 100;
      get(s.id, s.name, s.code).exam.push({ pct });
      const sem = r.exam.subjectOffering.semester.number;
      semBuckets.set(sem, [...(semBuckets.get(sem) ?? []), pct]);
    }
    for (const a of due) {
      const s = get(a.subjectOffering.subjectId, a.subjectOffering.subject.name, a.subjectOffering.subject.code);
      s.due++;
      if (a.submissions.length) s.submitted++;
    }
    const nameOf = new Map([...subj].map(([id, v]) => [id, v]));
    for (const sb of subs) {
      const e = nameOf.get(sb.assignment.subjectOffering.subjectId);
      if (e) e.asg.push((Number(sb.marks) / Number(sb.assignment.maxMarks)) * 100);
    }
    for (const a of att.subjects)
      if (a.subjectName && !subj.has(a.subjectId))
        subj.set(a.subjectId, { name: a.subjectName, code: '', exam: [], asg: [], due: 0, submitted: 0 });

    const allExamPct = [...subj.values()].flatMap((s) => s.exam.map((e) => e.pct));
    const overall = avg(allExamPct);
    const subjects: SubjectPerformance[] = [...subj]
      .map(([subjectId, s]) => {
        const pcts = s.exam.map((e) => e.pct);
        const half = Math.floor(pcts.length / 2);
        const trend = pcts.length >= 2 ? (avg(pcts.slice(half)) ?? 0) - (avg(pcts.slice(0, half || 1)) ?? 0) : 0;
        const a = att.subjects.find((x) => x.subjectId === subjectId);
        const examAvg = avg(pcts);
        const reasons: string[] = [];
        if (examAvg !== null && examAvg < 60) reasons.push(`exam average ${examAvg}% is below 60%`);
        if (examAvg !== null && overall !== null && examAvg < overall - 10)
          reasons.push(`${Math.round(overall - examAvg)} points below your overall average`);
        if (trend <= -8) reasons.push('recent exam scores are declining');
        if (a?.health === 'SHORTAGE') reasons.push(`attendance ${a.percentage}% is below the minimum`);
        if (s.due - s.submitted >= 2) reasons.push(`${s.due - s.submitted} assignments not submitted`);
        return {
          subjectId,
          name: s.name,
          code: s.code,
          examAvgPct: examAvg,
          examTrend: Math.round(trend * 10) / 10,
          assignmentAvgPct: avg(s.asg),
          assignmentsDue: s.due,
          assignmentsSubmitted: s.submitted,
          attendancePct: a?.percentage ?? null,
          attendanceHealth: a?.health ?? 'NO_DATA',
          weak: reasons.length > 0,
          weakReasons: reasons,
        };
      })
      .sort((x, y) => Number(y.weak) - Number(x.weak) || (x.examAvgPct ?? 101) - (y.examAvgPct ?? 101));

    return {
      studentId,
      cgpa: student.cgpa === null ? null : Number(student.cgpa),
      examAvgPct: overall,
      semesterAverages: [...semBuckets]
        .map(([semester, v]) => ({ semester, avgPct: avg(v) ?? 0 }))
        .sort((a, b) => a.semester - b.semester),
      subjects,
      weakSubjects: subjects.filter((s) => s.weak).map((s) => s.name),
    };
  }

  /** Scoped correlation: does attendance track marks? (aggregated, no individual data returned) */
  async attendanceVsPerformance(
    collegeId: string,
    deps?: string[],
  ): Promise<{ correlation: number | null; students: number; interpretation: string }> {
    const scope = deps && deps.length
      ? Prisma.sql`AND "studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<{ att: number; exam: number }[]>(Prisma.sql`
      SELECT a.pct AS att, e.pct AS exam FROM
        (SELECT "studentId", 100.0 * SUM(CASE WHEN status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0) AS pct
         FROM "Attendance" WHERE "collegeId" = ${collegeId} ${scope} GROUP BY "studentId") a
      JOIN (SELECT r."studentId", AVG(100.0 * r."marksObtained" / NULLIF(x."maxMarks",0)) AS pct
            FROM "ExamResult" r JOIN "Exam" x ON x.id = r."examId" WHERE r."collegeId" = ${collegeId} AND r.status = 'PUBLISHED' ${deps && deps.length ? Prisma.sql`AND r."studentId" IN (SELECT id FROM "Student" WHERE "departmentId" = ANY(${deps}::text[]))` : Prisma.empty} GROUP BY r."studentId") e
        ON e."studentId" = a."studentId" WHERE a.pct IS NOT NULL AND e.pct IS NOT NULL LIMIT 20000`);
    const r = pearson(
      rows.map((x) => Number(x.att)),
      rows.map((x) => Number(x.exam)),
    );
    const interpretation =
      r === null
        ? 'Not enough data'
        : Math.abs(r) < 0.2
          ? 'Little linear relationship'
          : r > 0
            ? r > 0.5
              ? 'Strong positive: higher attendance goes with higher marks'
              : 'Moderate positive relationship'
            : 'Negative relationship (investigate data quality)';
    return {
      correlation: r,
      students: rows.length,
      interpretation: `${interpretation}. Correlation is not causation.`,
    };
  }
}
