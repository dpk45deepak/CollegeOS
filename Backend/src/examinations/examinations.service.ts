import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ResultStatus } from '@prisma/client';
import { AccessService, isAdmin } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY, NotifyUsersEvent } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import * as D from './dto/exams.dto';
import { DEFAULT_BANDS, GradeBand, gpa, gradeFor, validateBands } from './grading';

@Injectable()
export class ExaminationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly own: OwnershipService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  // ── grading schemes ────────────────────────────────
  async createScheme(c: string, dto: D.CreateGradingSchemeDto) {
    const err = validateBands(dto.bands);
    if (err) throw new BadRequestException(err);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) await tx.gradingScheme.updateMany({ where: { collegeId: c }, data: { isDefault: false } });
      return tx.gradingScheme.create({
        data: {
          collegeId: c,
          name: dto.name,
          bands: dto.bands as unknown as Prisma.InputJsonValue,
          isDefault: !!dto.isDefault,
        },
      });
    });
  }
  listSchemes(c: string) {
    return this.prisma.gradingScheme.findMany({ where: { collegeId: c } });
  }

  private async bandsFor(c: string, schemeId?: string | null): Promise<GradeBand[]> {
    const s = schemeId
      ? await this.prisma.gradingScheme.findFirst({ where: { id: schemeId, collegeId: c } })
      : await this.prisma.gradingScheme.findFirst({ where: { collegeId: c, isDefault: true } });
    return (s?.bands as unknown as GradeBand[] | undefined) ?? DEFAULT_BANDS;
  }

  // ── exams ──────────────────────────────────────────
  async create(p: Principal, c: string, dto: D.CreateExamDto) {
    if (dto.passMarks > dto.maxMarks) throw new BadRequestException('passMarks exceeds maxMarks');
    const offering = await this.access.assertManagesOffering(p, c, dto.subjectOfferingId);
    await this.own.assert('room', dto.roomId, c);
    await this.own.assert('gradingScheme', dto.gradingSchemeId, c);

    // Clash check: same section or same room overlapping in time.
    const start = dto.scheduledAt;
    const end = new Date(start.getTime() + dto.durationMinutes * 60_000);
    const near = await this.prisma.exam.findMany({
      where: {
        collegeId: c,
        status: { not: 'CANCELLED' },
        scheduledAt: { gte: new Date(start.getTime() - 12 * 3_600_000), lt: end },
        OR: [{ subjectOffering: { sectionId: offering.sectionId } }, ...(dto.roomId ? [{ roomId: dto.roomId }] : [])],
      },
      select: { id: true, title: true, scheduledAt: true, durationMinutes: true, roomId: true },
    });
    const clash = near.filter((e) => e.scheduledAt.getTime() + e.durationMinutes * 60_000 > start.getTime());
    if (clash.length)
      throw new ConflictException({
        message: 'Exam schedule conflict (section or room)',
        errorCode: 'EXAM_CONFLICT',
        conflicts: clash.map((x) => x.title),
      });

    const exam = await this.prisma.exam.create({ data: { ...dto, collegeId: c } });
    const students = await this.prisma.enrollment.findMany({
      where: { subjectOfferingId: offering.id },
      select: { student: { select: { userId: true } } },
    });
    this.events.emit(DomainEvents.ExamScheduled, { collegeId: c, examId: exam.id });
    this.notify({
      collegeId: c,
      userIds: students.map((s) => s.student.userId),
      type: 'ExamScheduled',
      title: `${exam.type.replace('_', ' ')} scheduled: ${offering.subject.name}`,
      body: `${exam.title} on ${exam.scheduledAt.toISOString().slice(0, 16).replace('T', ' ')} UTC (${exam.durationMinutes} min).`,
      data: { examId: exam.id },
    });
    await this.audit.log({ collegeId: c, userId: p.userId, action: 'EXAM_CREATE', entity: 'Exam', entityId: exam.id });
    return exam;
  }

  async list(p: Principal, c: string, q: D.ExamListQueryDto) {
    const scope: Prisma.ExamWhereInput = p.studentId
      ? { subjectOffering: { enrollments: { some: { studentId: p.studentId } } } }
      : { subjectOffering: this.access.offeringWhere(p, c) };
    const where: Prisma.ExamWhereInput = {
      AND: [
        {
          collegeId: c,
          subjectOfferingId: q.subjectOfferingId,
          scheduledAt: q.upcoming ? { gte: new Date() } : undefined,
          status: { not: 'CANCELLED' },
        },
        scope,
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        ...toSkipTake(q),
        include: {
          subjectOffering: { select: { subject: { select: { name: true, code: true } } } },
          room: { select: { code: true } },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async cancel(p: Principal, c: string, id: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id, collegeId: c } });
    if (!exam) throw new NotFoundException();
    await this.access.assertManagesOffering(p, c, exam.subjectOfferingId);
    await this.audit.log({ collegeId: c, userId: p.userId, action: 'EXAM_CANCEL', entity: 'Exam', entityId: id });
    return this.prisma.exam.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  // ── marks entry & publishing ───────────────────────
  async enterResults(p: Principal, c: string, examId: string, dto: D.EnterResultsDto) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, collegeId: c } });
    if (!exam) throw new NotFoundException();
    const examController = p.roleKeys.includes(ROLE.EXAM_CONTROLLER);
    if (!examController) await this.access.assertManagesOffering(p, c, exam.subjectOfferingId);
    const enrolled = new Set(
      (
        await this.prisma.enrollment.findMany({
          where: { subjectOfferingId: exam.subjectOfferingId },
          select: { studentId: true },
        })
      ).map((e) => e.studentId),
    );
    const bands = await this.bandsFor(c, exam.gradingSchemeId);
    const existing = new Map(
      (await this.prisma.examResult.findMany({ where: { examId } })).map((r) => [r.studentId, r]),
    );

    for (const r of dto.results) {
      if (!enrolled.has(r.studentId)) throw new BadRequestException(`Student ${r.studentId} is not enrolled`);
      if (r.marksObtained > Number(exam.maxMarks))
        throw new BadRequestException(`Marks exceed maximum (${exam.maxMarks})`);
    }
    const touchesPublished = dto.results.some((r) => existing.get(r.studentId)?.status === ResultStatus.PUBLISHED);
    if (touchesPublished && !dto.reason)
      throw new BadRequestException({
        message: 'A reason is required to change published results',
        errorCode: 'REASON_REQUIRED',
      });

    await this.prisma.$transaction(async (tx) => {
      for (const r of dto.results) {
        const g = gradeFor(r.marksObtained, Number(exam.maxMarks), bands);
        const prev = existing.get(r.studentId);
        await tx.examResult.upsert({
          where: { examId_studentId: { examId, studentId: r.studentId } },
          create: {
            collegeId: c,
            examId,
            studentId: r.studentId,
            marksObtained: r.marksObtained,
            grade: g.grade,
            gradePoints: g.points,
            enteredById: p.userId,
          },
          update: { marksObtained: r.marksObtained, grade: g.grade, gradePoints: g.points, enteredById: p.userId },
        });
        if (prev && Number(prev.marksObtained) !== r.marksObtained) {
          await this.audit.log(
            {
              collegeId: c,
              userId: p.userId,
              action: 'RESULT_CHANGE',
              entity: 'ExamResult',
              entityId: prev.id,
              oldValue: { marks: prev.marksObtained, grade: prev.grade, status: prev.status },
              newValue: { marks: r.marksObtained, grade: g.grade },
              reason: dto.reason,
            },
            tx,
          );
        }
      }
    });
    return { saved: dto.results.length };
  }

  async publish(p: Principal, c: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, collegeId: c },
      include: { subjectOffering: { include: { subject: true } } },
    });
    if (!exam) throw new NotFoundException();
    const drafts = await this.prisma.examResult.findMany({
      where: { examId, status: ResultStatus.DRAFT },
      select: { id: true, studentId: true, student: { select: { userId: true } } },
    });
    if (!drafts.length) throw new BadRequestException('No draft results to publish');
    await this.prisma.$transaction(async (tx) => {
      await tx.examResult.updateMany({
        where: { examId, status: ResultStatus.DRAFT },
        data: { status: ResultStatus.PUBLISHED, publishedAt: new Date() },
      });
      await tx.exam.update({ where: { id: examId }, data: { status: 'COMPLETED' } });
      await this.audit.log(
        {
          collegeId: c,
          userId: p.userId,
          action: 'RESULT_PUBLISH',
          entity: 'Exam',
          entityId: examId,
          newValue: { count: drafts.length },
        },
        tx,
      );
    });
    await Promise.all(drafts.map((d) => this.recomputeCgpa(c, d.studentId)));
    this.events.emit(DomainEvents.ResultPublished, {
      collegeId: c,
      examId,
      studentIds: drafts.map((d) => d.studentId),
    });
    this.notify({
      collegeId: c,
      userIds: drafts.map((d) => d.student.userId),
      type: 'ResultPublished',
      title: `Result published: ${exam.subjectOffering.subject.name}`,
      body: `${exam.title} results are now available.`,
      data: { examId },
    });
    return { published: drafts.length };
  }

  async examResults(p: Principal, c: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, collegeId: c } });
    if (!exam) throw new NotFoundException();
    if (!p.roleKeys.includes(ROLE.EXAM_CONTROLLER))
      await this.access.assertManagesOffering(p, c, exam.subjectOfferingId);
    return this.prisma.examResult.findMany({
      where: { examId },
      include: { student: { select: { rollNumber: true, user: { select: { firstName: true, lastName: true } } } } },
      orderBy: { student: { rollNumber: 'asc' } },
    });
  }

  /** Upcoming (non-cancelled) exams for a student's enrolled subjects. */
  upcomingForStudent(c: string, studentId: string, days = 60) {
    return this.prisma.exam.findMany({
      where: {
        collegeId: c,
        status: { not: 'CANCELLED' },
        scheduledAt: { gte: new Date(), lte: new Date(Date.now() + days * 86_400_000) },
        subjectOffering: { enrollments: { some: { studentId } } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
      select: {
        id: true,
        title: true,
        type: true,
        scheduledAt: true,
        durationMinutes: true,
        maxMarks: true,
        room: { select: { code: true } },
        subjectOffering: { select: { subject: { select: { id: true, name: true, code: true } } } },
      },
    });
  }

  /** Published results only. */
  async studentResults(c: string, studentId: string) {
    const rows = await this.prisma.examResult.findMany({
      where: { collegeId: c, studentId, status: ResultStatus.PUBLISHED },
      orderBy: { publishedAt: 'desc' },
      select: {
        marksObtained: true,
        grade: true,
        gradePoints: true,
        publishedAt: true,
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            maxMarks: true,
            passMarks: true,
            scheduledAt: true,
            subjectOffering: {
              select: {
                subject: { select: { id: true, name: true, code: true, credits: true } },
                semester: { select: { number: true } },
              },
            },
          },
        },
      },
    });
    return rows.map((r) => ({
      ...r,
      passed: Number(r.marksObtained) >= Number(r.exam.passMarks),
      percentage: Math.round((Number(r.marksObtained) / Number(r.exam.maxMarks)) * 10000) / 100,
    }));
  }

  /** CGPA = credit-weighted mean of END_SEM grade points over published subjects (documented assumption). */
  async recomputeCgpa(c: string, studentId: string): Promise<number | null> {
    const rows = await this.prisma.examResult.findMany({
      where: {
        collegeId: c,
        studentId,
        status: ResultStatus.PUBLISHED,
        exam: { type: 'END_SEM' },
        gradePoints: { not: null },
      },
      select: {
        gradePoints: true,
        exam: { select: { subjectOffering: { select: { subject: { select: { credits: true } } } } } },
      },
    });
    const value = gpa(
      rows.map((r) => ({ credits: r.exam.subjectOffering.subject.credits, points: Number(r.gradePoints) })),
    );
    await this.prisma.student.update({ where: { id: studentId }, data: { cgpa: value } });
    return value;
  }

  private notify(e: NotifyUsersEvent) {
    if (e.userIds.length) this.events.emit(NOTIFY, e);
  }
}
export { isAdmin, ForbiddenException };
