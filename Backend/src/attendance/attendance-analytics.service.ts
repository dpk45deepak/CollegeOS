import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceStatus } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { AttendanceShortageEvent, DomainEvents } from '../common/events';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  StatusCounts,
  SubjectAttendance,
  addStatus,
  attendedAndTotal,
  consecutiveAbsences,
  emptyCounts,
  percentage,
  summarise,
  suddenDecline,
} from './attendance-math';

export interface StudentAttendanceReport {
  studentId: string;
  threshold: number;
  overall: SubjectAttendance;
  subjects: SubjectAttendance[];
  flags: AttendanceFlag[];
}
export interface AttendanceFlag {
  type: 'BELOW_THRESHOLD' | 'APPROACHING_SHORTAGE' | 'SUDDEN_DECLINE' | 'REPEATED_SUBJECT_ABSENCE';
  subjectId?: string;
  subjectName?: string;
  detail: string;
}
const WINDOW_DAYS = 14;

@Injectable()
export class AttendanceAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly redis: RedisService,
    private readonly events: EventEmitter2,
  ) {}

  async threshold(collegeId: string): Promise<number> {
    const c = await this.prisma.college.findUniqueOrThrow({
      where: { id: collegeId },
      select: { attendanceThreshold: true },
    });
    return Number(c.attendanceThreshold);
  }

  /** Full per-subject picture + intelligence flags for a batch of students (one grouped query for all). */
  async reports(collegeId: string, studentIds: string[]): Promise<Map<string, StudentAttendanceReport>> {
    const threshold = await this.threshold(collegeId);
    const out = new Map<string, StudentAttendanceReport>();
    if (!studentIds.length) return out;

    const since = new Date(Date.now() - 2 * WINDOW_DAYS * 86_400_000);
    const [groups, recent, subjects] = await Promise.all([
      this.prisma.attendance.groupBy({
        by: ['studentId', 'subjectId', 'status'],
        where: { collegeId, studentId: { in: studentIds } },
        _count: { _all: true },
      }),
      this.prisma.attendance.findMany({
        where: { collegeId, studentId: { in: studentIds }, date: { gte: since } },
        select: { studentId: true, subjectId: true, status: true, date: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.subject.findMany({ where: { collegeId }, select: { id: true, name: true } }),
    ]);
    const names = new Map(subjects.map((s) => [s.id, s.name]));

    const perStudent = new Map<string, Map<string, StatusCounts>>();
    for (const g of groups) {
      const subj = perStudent.get(g.studentId) ?? new Map<string, StatusCounts>();
      const counts = subj.get(g.subjectId) ?? emptyCounts();
      addStatus(counts, g.status, g._count._all);
      subj.set(g.subjectId, counts);
      perStudent.set(g.studentId, subj);
    }
    const recentBy = new Map<string, typeof recent>();
    for (const r of recent) (recentBy.get(r.studentId) ?? recentBy.set(r.studentId, []).get(r.studentId)!).push(r);

    const cutoff = Date.now() - WINDOW_DAYS * 86_400_000;
    for (const studentId of studentIds) {
      const subj = perStudent.get(studentId) ?? new Map<string, StatusCounts>();
      const overallCounts = emptyCounts();
      const subjects: SubjectAttendance[] = [];
      for (const [subjectId, counts] of subj) {
        (Object.keys(counts) as (keyof StatusCounts)[]).forEach((k) => (overallCounts[k] += counts[k]));
        subjects.push(summarise(subjectId, counts, threshold, names.get(subjectId)));
      }
      subjects.sort((a, b) => (a.percentage ?? 101) - (b.percentage ?? 101));
      const overall = summarise('ALL', overallCounts, threshold, 'Overall');

      const flags: AttendanceFlag[] = [];
      for (const s of subjects) {
        if (s.health === 'SHORTAGE')
          flags.push({
            type: 'BELOW_THRESHOLD',
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            detail: `${s.percentage}% (needs ${s.classesNeeded ?? 'n/a'} more consecutive classes to reach ${threshold}%)`,
          });
        else if (s.health === 'WARNING')
          flags.push({
            type: 'APPROACHING_SHORTAGE',
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            detail: `${s.percentage}% — can miss only ${s.canMiss} more class(es)`,
          });
      }
      const rec = recentBy.get(studentId) ?? [];
      const win = (pred: (t: number) => boolean) => {
        const c = emptyCounts();
        rec.filter((r) => pred(r.date.getTime())).forEach((r) => addStatus(c, r.status));
        return attendedAndTotal(c);
      };
      if (
        suddenDecline(
          win((t) => t >= cutoff),
          win((t) => t < cutoff),
        )
      ) {
        const r = win((t) => t >= cutoff);
        flags.push({
          type: 'SUDDEN_DECLINE',
          detail: `Last ${WINDOW_DAYS} days: ${percentage(r.attended, r.total)}% vs a much higher previous period`,
        });
      }
      const bySubject = new Map<string, AttendanceStatus[]>();
      for (const r of rec)
        (bySubject.get(r.subjectId) ?? bySubject.set(r.subjectId, []).get(r.subjectId)!).push(r.status);
      for (const [subjectId, statuses] of bySubject) {
        const run = consecutiveAbsences(statuses);
        if (run >= 3)
          flags.push({
            type: 'REPEATED_SUBJECT_ABSENCE',
            subjectId,
            subjectName: names.get(subjectId),
            detail: `${run} consecutive absences`,
          });
      }
      out.set(studentId, { studentId, threshold, overall, subjects, flags });
    }
    return out;
  }

  async report(collegeId: string, studentId: string): Promise<StudentAttendanceReport> {
    return (await this.reports(collegeId, [studentId])).get(studentId)!;
  }

  /** Students in the caller's scope that are below the threshold (HOD → department, teacher → own students). */
  async shortageList(p: Principal, collegeId: string, q: PaginationQueryDto) {
    const students = await this.prisma.student.findMany({
      where: this.access.studentWhere(p, collegeId),
      select: { id: true, rollNumber: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { rollNumber: 'asc' },
      take: 1000,
    });
    const reports = await this.reports(
      collegeId,
      students.map((s) => s.id),
    );
    const rows = students
      .map((s) => ({ student: s, report: reports.get(s.id)! }))
      .filter((r) => r.report.overall.health === 'SHORTAGE' || r.report.subjects.some((x) => x.health === 'SHORTAGE'))
      .sort((a, b) => (a.report.overall.percentage ?? 0) - (b.report.overall.percentage ?? 0));
    const page = rows.slice((q.page - 1) * q.limit, q.page * q.limit);
    return paginate(
      page.map((r) => ({ ...r.student, overall: r.report.overall, flags: r.report.flags })),
      rows.length,
      q,
    );
  }

  /** Review-worthy patterns for HOD/admin. Observations, not accusations. */
  async anomalies(p: Principal, collegeId: string) {
    const offerings = await this.prisma.subjectOffering.findMany({
      where: this.access.offeringWhere(p, collegeId),
      select: {
        id: true,
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
        subject: { select: { name: true } },
      },
      take: 500,
    });
    const found: { type: string; offeringId: string; subject: string; teacher: string; detail: string }[] = [];
    for (const o of offerings) {
      const sessions = await this.prisma.attendanceSession.findMany({
        where: { subjectOfferingId: o.id },
        orderBy: { date: 'desc' },
        take: 10,
        select: { date: true, createdAt: true, records: { select: { status: true } } },
      });
      const label = {
        offeringId: o.id,
        subject: o.subject.name,
        teacher: `${o.teacher.user.firstName} ${o.teacher.user.lastName}`,
      };
      const late = sessions.filter((s) => s.createdAt.getTime() - s.date.getTime() > 3 * 86_400_000).length;
      if (late >= 3)
        found.push({
          type: 'LATE_MARKING',
          ...label,
          detail: `${late} of the last ${sessions.length} sessions were recorded 3+ days late`,
        });
      const perfect =
        sessions.length >= 10 &&
        sessions.every((s) => s.records.length >= 20 && s.records.every((r) => r.status === 'PRESENT'));
      if (perfect)
        found.push({
          type: 'UNIFORM_PRESENT',
          ...label,
          detail: 'Last 10 sessions all show 100% present — worth a spot check',
        });
    }
    return found;
  }

  /** Emits AttendanceShortageDetected at most once per student per ISO week (Redis dedupe). */
  async scanAndEmit(collegeId: string, studentIds: string[]): Promise<number> {
    const reports = await this.reports(collegeId, studentIds);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds }, collegeId },
      select: { id: true, userId: true, guardians: { select: { userId: true } } },
    });
    const week = `${new Date().getUTCFullYear()}-${Math.floor(Date.now() / (7 * 86_400_000))}`;
    let emitted = 0;
    for (const s of students) {
      const rep = reports.get(s.id);
      if (!rep) continue;
      const bad = rep.subjects.filter((x) => x.health === 'SHORTAGE');
      if (!bad.length && rep.overall.health !== 'SHORTAGE') continue;
      const worst = bad[0] ?? rep.overall;
      const key = `shortage:${s.id}:${week}`;
      const locked = await this.redis.safeSet(key, '1', 'EX', 8 * 86_400, 'NX');
      if (this.redis.isHealthy() && !locked) continue;
      const teachers =
        worst.subjectId !== 'ALL'
          ? await this.prisma.subjectOffering.findMany({
              where: { collegeId, subjectId: worst.subjectId, enrollments: { some: { studentId: s.id } } },
              select: { teacher: { select: { userId: true } } },
            })
          : [];
      const event: AttendanceShortageEvent = {
        collegeId,
        studentId: s.id,
        studentUserId: s.userId,
        teacherUserIds: teachers.map((t) => t.teacher.userId),
        parentUserIds: s.guardians.map((g) => g.userId).filter((u): u is string => !!u),
        subjectId: worst.subjectId === 'ALL' ? undefined : worst.subjectId,
        subjectName: worst.subjectName,
        percentage: worst.percentage ?? 0,
        threshold: rep.threshold,
        classesNeeded: worst.classesNeeded,
      };
      this.events.emit(DomainEvents.AttendanceShortageDetected, event);
      emitted++;
    }
    return emitted;
  }
}
