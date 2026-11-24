import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY, NotifyUsersEvent } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import * as D from './dto/assignments.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

  async create(p: Principal, c: string, dto: D.CreateAssignmentDto) {
    const offering = await this.access.assertManagesOffering(p, c, dto.subjectOfferingId);
    if (dto.dueAt <= new Date()) throw new BadRequestException('dueAt must be in the future');
    if (dto.rubric && dto.rubric.reduce((s, r) => s + r.maxMarks, 0) > dto.maxMarks)
      throw new BadRequestException('Rubric marks exceed assignment maxMarks');
    if (dto.attachmentKeys) this.storage.assertKeysBelong(dto.attachmentKeys, c);
    const a = await this.prisma.assignment.create({
      data: {
        ...dto,
        rubric: dto.rubric as unknown as Prisma.InputJsonValue,
        attachmentKeys: dto.attachmentKeys ?? [],
        collegeId: c,
        createdById: p.userId,
      },
    });
    const students = await this.prisma.enrollment.findMany({
      where: { subjectOfferingId: offering.id },
      select: { student: { select: { userId: true } } },
    });
    this.notify({
      collegeId: c,
      userIds: students.map((s) => s.student.userId),
      type: 'AssignmentCreated',
      title: `New assignment: ${a.title}`,
      body: `${offering.subject.name} — due ${a.dueAt.toISOString().slice(0, 10)}`,
      data: { assignmentId: a.id },
    });
    return a;
  }

  /** Students see assignments of subjects they are enrolled in + their own submission state. */
  async listForStudent(c: string, studentId: string, q: D.AssignmentListQueryDto) {
    const where: Prisma.AssignmentWhereInput = {
      collegeId: c,
      subjectOffering: { enrollments: { some: { studentId } } },
      subjectOfferingId: q.subjectOfferingId,
      ...(q.pending === 'true' ? { submissions: { none: { studentId } } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        ...toSkipTake(q),
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          maxMarks: true,
          rubric: true,
          attachmentKeys: true,
          subjectOffering: { select: { subject: { select: { name: true, code: true } } } },
          submissions: {
            where: { studentId },
            select: { status: true, submittedAt: true, marks: true, feedback: true },
          },
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);
    return paginate(
      items.map(({ submissions, ...a }) => ({
        ...a,
        submission: submissions[0] ?? null,
        overdue: !submissions[0] && a.dueAt < new Date(),
      })),
      total,
      q,
    );
  }

  async listForTeacher(p: Principal, c: string, q: D.AssignmentListQueryDto) {
    const where: Prisma.AssignmentWhereInput = {
      AND: [
        { collegeId: c, subjectOfferingId: q.subjectOfferingId },
        { subjectOffering: this.access.offeringWhere(p, c) },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        orderBy: { dueAt: 'desc' },
        ...toSkipTake(q),
        include: {
          _count: { select: { submissions: true } },
          submissions: {
            where: { status: { in: ['SUBMITTED', 'LATE'] } },
            select: { id: true },
          },
          subjectOffering: { select: { subject: { select: { name: true } } } },
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);
    return paginate(
      items.map(({ submissions, ...item }) => ({
        ...item,
        pendingCount: submissions.length,
      })),
      total,
      q,
    );
  }

  async submit(p: Principal, c: string, assignmentId: string, dto: D.SubmitDto) {
    if (!p.studentId) throw new ForbiddenException('Only students can submit');
    if (!dto.text && !dto.fileKeys?.length) throw new BadRequestException('Provide text or at least one file');
    const a = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, collegeId: c, subjectOffering: { enrollments: { some: { studentId: p.studentId } } } },
    });
    if (!a) throw new NotFoundException('Assignment not found');
    if (dto.fileKeys) this.storage.assertKeysBelong(dto.fileKeys, c, p.userId);
    const existing = await this.prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: p.studentId } },
    });
    if (existing && existing.status === SubmissionStatus.GRADED)
      throw new ConflictException({ message: 'Already graded; resubmission closed', errorCode: 'SUBMISSION_LOCKED' });
    const late = new Date() > a.dueAt;
    return this.prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: p.studentId } },
      create: {
        assignmentId,
        studentId: p.studentId,
        text: dto.text,
        fileKeys: dto.fileKeys ?? [],
        status: late ? 'LATE' : 'SUBMITTED',
      },
      update: {
        text: dto.text,
        fileKeys: dto.fileKeys !== undefined ? dto.fileKeys : (existing?.fileKeys ?? []),
        submittedAt: new Date(),
        status: late ? 'LATE' : 'SUBMITTED',
      },
    });
  }

  async submissions(p: Principal, c: string, assignmentId: string, q: PaginationQueryDto) {
    const a = await this.prisma.assignment.findFirst({ where: { id: assignmentId, collegeId: c } });
    if (!a) throw new NotFoundException();
    await this.access.assertManagesOffering(p, c, a.subjectOfferingId);
    const where = { assignmentId };
    const [items, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        ...toSkipTake(q),
        orderBy: { submittedAt: 'asc' },
        include: { student: { select: { rollNumber: true, user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.submission.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async missing(p: Principal, c: string, assignmentId: string) {
    const a = await this.prisma.assignment.findFirst({ where: { id: assignmentId, collegeId: c } });
    if (!a) throw new NotFoundException();
    await this.access.assertManagesOffering(p, c, a.subjectOfferingId);
    return this.prisma.enrollment
      .findMany({
        where: { subjectOfferingId: a.subjectOfferingId, student: { submissions: { none: { assignmentId } } } },
        select: {
          student: { select: { id: true, rollNumber: true, user: { select: { firstName: true, lastName: true } } } },
        },
      })
      .then((r) => ({ pastDue: a.dueAt < new Date(), students: r.map((x) => x.student) }));
  }

  async grade(p: Principal, c: string, submissionId: string, dto: D.GradeDto) {
    const s = await this.prisma.submission.findFirst({
      where: { id: submissionId, assignment: { collegeId: c } },
      include: { assignment: true, student: { select: { userId: true } } },
    });
    if (!s) throw new NotFoundException();
    await this.access.assertManagesOffering(p, c, s.assignment.subjectOfferingId);
    if (dto.marks > Number(s.assignment.maxMarks))
      throw new BadRequestException(`Marks exceed maximum (${s.assignment.maxMarks})`);
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { marks: dto.marks, feedback: dto.feedback, status: 'GRADED', gradedById: p.userId, gradedAt: new Date() },
    });
    this.notify({
      collegeId: c,
      userIds: [s.student.userId],
      type: 'AssignmentGraded',
      title: `Graded: ${s.assignment.title}`,
      body: `You scored ${dto.marks}/${s.assignment.maxMarks}.`,
      data: { assignmentId: s.assignmentId },
    });
    return updated;
  }

  /** Students with ≥ minMissed past-due assignments they never submitted (last `sinceDays` days). */
  async missedCounts(
    collegeId: string,
    opts: { studentIds?: string[]; sinceDays?: number; minMissed?: number } = {},
  ): Promise<Map<string, number>> {
    const since = new Date(Date.now() - (opts.sinceDays ?? 60) * 86_400_000);
    const rows = await this.prisma.$queryRaw<{ studentId: string; missed: bigint }[]>(Prisma.sql`
      SELECT e."studentId", COUNT(*)::bigint AS missed
      FROM "Enrollment" e
      JOIN "Assignment" a ON a."subjectOfferingId" = e."subjectOfferingId" AND a."dueAt" < now() AND a."dueAt" > ${since}
      LEFT JOIN "Submission" s ON s."assignmentId" = a.id AND s."studentId" = e."studentId"
      WHERE e."collegeId" = ${collegeId} AND s.id IS NULL
        ${opts.studentIds?.length ? Prisma.sql`AND e."studentId" = ANY(${opts.studentIds}::text[])` : Prisma.empty}
      GROUP BY e."studentId"
      HAVING COUNT(*) >= ${opts.minMissed ?? 1}`);
    return new Map(rows.map((r) => [r.studentId, Number(r.missed)]));
  }

  /** Called by the scheduler: nudges students about assignments due within 24h that they haven't submitted. */
  async notifyApproachingDeadlines(collegeId: string): Promise<number> {
    const soon = new Date(Date.now() + 24 * 3_600_000);
    const due = await this.prisma.assignment.findMany({
      where: { collegeId, dueAt: { gt: new Date(), lte: soon } },
      select: { id: true, title: true, dueAt: true, subjectOfferingId: true },
    });
    let sent = 0;
    for (const a of due) {
      const locked = await this.redis.safeSet(`deadline:${a.id}`, '1', 'EX', 36 * 3600, 'NX');
      if (this.redis.isHealthy() && !locked) continue;
      const pending = await this.prisma.enrollment.findMany({
        where: { subjectOfferingId: a.subjectOfferingId, student: { submissions: { none: { assignmentId: a.id } } } },
        select: { student: { select: { userId: true } } },
      });
      this.events.emit(DomainEvents.AssignmentDeadlineApproaching, { assignmentId: a.id });
      this.notify({
        collegeId,
        userIds: pending.map((x) => x.student.userId),
        type: 'AssignmentDeadlineApproaching',
        title: `Due soon: ${a.title}`,
        body: `Deadline ${a.dueAt.toISOString().replace('T', ' ').slice(0, 16)} UTC. You haven't submitted yet.`,
        data: { assignmentId: a.id },
      });
      sent += pending.length;
    }
    return sent;
  }

  private notify(e: NotifyUsersEvent) {
    if (e.userIds.length) this.events.emit(NOTIFY, e);
  }
}
