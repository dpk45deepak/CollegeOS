import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { OwnershipService } from '../access/ownership.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as D from './dto/scholarships.dto';
import { MatchResult, ScholarshipEligibility, StudentProfileForMatching, matchScholarship } from './eligibility';

@Injectable()
export class ScholarshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly attendance: AttendanceAnalyticsService,
    private readonly events: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

  create(c: string, dto: D.CreateScholarshipDto) {
    return this.prisma.scholarship.create({
      data: { ...dto, eligibility: dto.eligibility as Prisma.InputJsonValue | undefined, collegeId: c },
    });
  }
  async update(c: string, id: string, dto: D.UpdateScholarshipDto) {
    await this.own.assert('scholarship', id, c);
    return this.prisma.scholarship.update({
      where: { id },
      data: { ...dto, eligibility: dto.eligibility as Prisma.InputJsonValue | undefined },
    });
  }

  async list(c: string, q: D.ScholarshipQueryDto, openOnly = true) {
    const where: Prisma.ScholarshipWhereInput = {
      collegeId: c,
      type: q.type,
      isActive: true,
      ...(openOnly ? { OR: [{ deadline: null }, { deadline: { gte: new Date() } }] } : {}),
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.scholarship.findMany({ where, orderBy: { deadline: 'asc' }, ...toSkipTake(q) }),
      this.prisma.scholarship.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async profileFor(c: string, studentId: string): Promise<StudentProfileForMatching> {
    const s = await this.prisma.student.findFirstOrThrow({
      where: { id: studentId, collegeId: c },
      include: { program: { select: { code: true } }, semester: { select: { number: true } } },
    });
    const att = await this.attendance.report(c, studentId);
    return {
      cgpa: s.cgpa === null ? null : Number(s.cgpa),
      attendance: att.overall.percentage,
      programCode: s.program.code,
      departmentId: s.departmentId,
      semesterNumber: s.semester?.number ?? null,
    };
  }

  /** Open scholarships ranked by fit for the signed-in student (explainable). */
  async matchesForStudent(p: Principal, c: string): Promise<{ scholarship: unknown; match: MatchResult }[]> {
    if (!p.studentId) throw new ForbiddenException('Students only');
    const profile = await this.profileFor(c, p.studentId);
    const open = await this.prisma.scholarship.findMany({
      where: { collegeId: c, isActive: true, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
      orderBy: { deadline: 'asc' },
    });
    const order = { ELIGIBLE: 0, POSSIBLE: 1, NOT_ELIGIBLE: 2 } as const;
    return open
      .map((s) => ({
        scholarship: s,
        match: matchScholarship(profile, s.eligibility as ScholarshipEligibility | null),
      }))
      .filter((m) => m.match.fit !== 'NOT_ELIGIBLE')
      .sort((a, b) => order[a.match.fit] - order[b.match.fit]);
  }

  async express(p: Principal, c: string, id: string, applied: boolean) {
    if (!p.studentId) throw new ForbiddenException('Students only');
    await this.own.assert('scholarship', id, c);
    const existing = await this.prisma.scholarshipApplication.findUnique({
      where: { scholarshipId_studentId: { scholarshipId: id, studentId: p.studentId } },
    });
    if (existing && ['APPROVED', 'DISBURSED'].includes(existing.status)) throw new ConflictException('Already decided');
    return this.prisma.scholarshipApplication.upsert({
      where: { scholarshipId_studentId: { scholarshipId: id, studentId: p.studentId } },
      create: {
        scholarshipId: id,
        studentId: p.studentId,
        status: applied ? 'APPLIED' : 'INTERESTED',
        appliedAt: applied ? new Date() : null,
      },
      update: { status: applied ? 'APPLIED' : 'INTERESTED', appliedAt: applied ? new Date() : undefined },
    });
  }
  myApplications(p: Principal) {
    return this.prisma.scholarshipApplication.findMany({
      where: { studentId: p.studentId ?? '__none__' },
      include: { scholarship: { select: { name: true, deadline: true } } },
    });
  }
  async decide(c: string, scholarshipId: string, studentId: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED') {
    await this.own.assert('scholarship', scholarshipId, c);
    const app = await this.prisma.scholarshipApplication.findUnique({
      where: { scholarshipId_studentId: { scholarshipId, studentId } },
      include: { student: { select: { userId: true } }, scholarship: { select: { name: true } } },
    });
    if (!app) throw new NotFoundException();
    await this.prisma.scholarshipApplication.update({ where: { id: app.id }, data: { status } });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: [app.student.userId],
      type: 'ScholarshipDecision',
      title: `Scholarship ${status.toLowerCase()}`,
      body: app.scholarship.name,
      data: { scholarshipId },
    });
    return { status };
  }

  /** Scheduler hook: deadline within 3 days → notify students who showed interest or are eligible but haven't applied. */
  async notifyApproachingDeadlines(c: string): Promise<number> {
    const soon = await this.prisma.scholarship.findMany({
      where: { collegeId: c, isActive: true, deadline: { gt: new Date(), lte: new Date(Date.now() + 3 * 86_400_000) } },
    });
    let n = 0;
    for (const s of soon) {
      if (!(await this.redis.client.set(`schdeadline:${s.id}`, '1', 'EX', 3 * 86_400, 'NX'))) continue;
      const interested = await this.prisma.scholarshipApplication.findMany({
        where: { scholarshipId: s.id, status: 'INTERESTED' },
        select: { student: { select: { userId: true } } },
      });
      this.events.emit(DomainEvents.ScholarshipDeadlineApproaching, { scholarshipId: s.id });
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: interested.map((i) => i.student.userId),
        type: 'ScholarshipDeadlineApproaching',
        title: `Deadline soon: ${s.name}`,
        body: `Closes ${s.deadline!.toISOString().slice(0, 10)}. Required: ${s.requiredDocuments.join(', ') || 'see details'}.`,
        data: { scholarshipId: s.id },
      });
      n += interested.length;
    }
    return n;
  }
}
