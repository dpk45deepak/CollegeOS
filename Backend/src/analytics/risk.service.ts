import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { AssignmentsService } from '../assignments/assignments.service';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { DomainEvents } from '../common/events';
import { PrismaService } from '../prisma/prisma.service';
import { RISK_DISCLAIMER, RiskAssessment, RiskFeatures, computeRisk } from './risk';

@Injectable()
export class RiskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceAnalyticsService,
    private readonly assignments: AssignmentsService,
    private readonly events: EventEmitter2,
  ) {}

  /** Gathers features for many students with a handful of grouped queries (no per-student N+1). */
  async featuresFor(collegeId: string, studentIds: string[]): Promise<Map<string, RiskFeatures>> {
    const out = new Map<string, RiskFeatures>();
    if (!studentIds.length) return out;
    const [att, missed, results, dueCounts] = await Promise.all([
      this.attendance.reports(collegeId, studentIds),
      this.assignments.missedCounts(collegeId, { studentIds, sinceDays: 90 }),
      this.prisma.examResult.findMany({
        where: { collegeId, studentId: { in: studentIds }, status: 'PUBLISHED' },
        select: {
          studentId: true,
          marksObtained: true,
          exam: { select: { maxMarks: true, passMarks: true, scheduledAt: true } },
        },
        orderBy: { exam: { scheduledAt: 'asc' } },
      }),
      this.prisma.enrollment.findMany({
        where: { collegeId, studentId: { in: studentIds } },
        select: {
          studentId: true,
          subjectOffering: {
            select: {
              assignments: {
                where: { dueAt: { lt: new Date(), gt: new Date(Date.now() - 90 * 86_400_000) } },
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);
    const exams = new Map<string, { pct: number; failed: boolean }[]>();
    for (const r of results)
      (exams.get(r.studentId) ?? exams.set(r.studentId, []).get(r.studentId)!).push({
        pct: (Number(r.marksObtained) / Number(r.exam.maxMarks)) * 100,
        failed: Number(r.marksObtained) < Number(r.exam.passMarks),
      });
    const due = new Map<string, number>();
    for (const e of dueCounts) due.set(e.studentId, (due.get(e.studentId) ?? 0) + e.subjectOffering.assignments.length);
    const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

    for (const id of studentIds) {
      const a = att.get(id);
      const ex = exams.get(id) ?? [];
      const half = Math.floor(ex.length / 2);
      const decline = a?.flags.find((f) => f.type === 'SUDDEN_DECLINE') ? 15 : 0;
      const dueN = due.get(id) ?? 0;
      const missedN = missed.get(id) ?? 0;
      out.set(id, {
        attendancePct: a?.overall.percentage ?? null,
        attendanceDrop: decline,
        examAvgPct: ex.length ? mean(ex.map((e) => e.pct)) : null,
        examTrend:
          ex.length >= 2 ? mean(ex.slice(half).map((e) => e.pct)) - mean(ex.slice(0, half || 1).map((e) => e.pct)) : 0,
        assignmentMissRate: dueN ? Math.min(1, missedN / dueN) : 0,
        missedAssignments: missedN,
        failedExams: ex.filter((e) => e.failed).length,
        dataPoints: (a?.overall.total ?? 0) + ex.length * 3 + dueN,
      });
    }
    return out;
  }

  async assess(collegeId: string, studentId: string, persist = true): Promise<RiskAssessment & { disclaimer: string }> {
    const f = (await this.featuresFor(collegeId, [studentId])).get(studentId)!;
    const r = computeRisk(f);
    if (persist) await this.persist(collegeId, studentId, r);
    return { ...r, disclaimer: RISK_DISCLAIMER };
  }

  /** Batch recompute (analytics queue). Stores features + reasons for every assessment. */
  async assessMany(collegeId: string, studentIds: string[]): Promise<number> {
    const feats = await this.featuresFor(collegeId, studentIds);
    for (const [id, f] of feats) await this.persist(collegeId, id, computeRisk(f));
    return feats.size;
  }

  private async persist(collegeId: string, studentId: string, r: RiskAssessment) {
    const prev = await this.prisma.academicRiskAssessment.findFirst({
      where: { studentId },
      orderBy: { computedAt: 'desc' },
      select: { level: true },
    });
    await this.prisma.academicRiskAssessment.create({
      data: {
        collegeId,
        studentId,
        level: r.level,
        score: r.score,
        features: r.features as unknown as Prisma.InputJsonValue,
        reasons: r.reasons,
        modelVersion: r.modelVersion,
      },
    });
    if (prev && prev.level !== r.level)
      this.events.emit(DomainEvents.RiskAssessed, { collegeId, studentId, from: prev.level, to: r.level });
  }
}
