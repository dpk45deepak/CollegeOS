import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttendanceMode, AttendanceStatus, CorrectionStatus, Prisma } from '@prisma/client';
import { AccessService, isAdmin } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { AttendanceUpdatedEvent, DomainEvents, NOTIFY, NotifyUsersEvent } from '../common/events';
import { Principal } from '../common/types/principal';
import { REALTIME_EMIT } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import * as D from './dto/attendance.dto';

/** Teachers may record attendance for today and up to N days back; older needs an admin. */
export const BACKDATE_DAYS = 2;
const startOfUtcDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

export function resolvePeriodKey(mode: AttendanceMode, dto: { timetableSlotId?: string; periodKey?: string }): string {
  if (mode === 'DAILY') return 'DAY';
  const key = dto.timetableSlotId ?? dto.periodKey;
  if (!key) throw new BadRequestException(`${mode} attendance requires timetableSlotId or periodKey`);
  return key;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  // ───────── marking ─────────
  async mark(p: Principal, c: string, dto: D.MarkAttendanceDto) {
    const offering = await this.access.assertManagesOffering(p, c, dto.subjectOfferingId);
    const college = await this.prisma.college.findUniqueOrThrow({ where: { id: c }, select: { attendanceMode: true } });

    const today = startOfUtcDay(new Date());
    const date = startOfUtcDay(dto.date);
    if (date > today) throw new BadRequestException('Cannot mark attendance for a future date');
    if (!isAdmin(p) && (today.getTime() - date.getTime()) / 86_400_000 > BACKDATE_DAYS) {
      throw new ForbiddenException({
        message: `Attendance older than ${BACKDATE_DAYS} days can only be changed through a correction request`,
        errorCode: 'BACKDATE_LIMIT',
      });
    }
    const periodKey = resolvePeriodKey(college.attendanceMode, dto);

    const enrolled = await this.prisma.enrollment.findMany({
      where: { subjectOfferingId: offering.id },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));
    const explicit = new Map<string, D.AttendanceRecordDto>();
    for (const r of dto.records) {
      if (!enrolledIds.has(r.studentId))
        throw new BadRequestException(`Student ${r.studentId} is not enrolled in this subject`);
      if (explicit.has(r.studentId)) throw new BadRequestException(`Duplicate record for student ${r.studentId}`);
      explicit.set(r.studentId, r);
    }
    const rows: Prisma.AttendanceCreateManyInput[] = [];
    const sessionIdHolder: { id?: string } = {};
    const skipped: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const session = await tx.attendanceSession.upsert({
        where: { subjectOfferingId_date_periodKey: { subjectOfferingId: offering.id, date, periodKey } },
        update: {},
        create: {
          collegeId: c,
          subjectOfferingId: offering.id,
          timetableSlotId: dto.timetableSlotId,
          date,
          periodKey,
          mode: college.attendanceMode,
          markedById: p.userId,
        },
      });
      sessionIdHolder.id = session.id;
      const already = new Set(
        (await tx.attendance.findMany({ where: { sessionId: session.id }, select: { studentId: true } })).map(
          (a) => a.studentId,
        ),
      );
      for (const studentId of enrolledIds) {
        const rec = explicit.get(studentId);
        const status = rec?.status ?? dto.defaultStatus;
        if (!status) continue;
        if (already.has(studentId)) {
          skipped.push(studentId);
          continue;
        } // never overwrite → use correction workflow
        rows.push({
          collegeId: c,
          sessionId: session.id,
          studentId,
          subjectId: offering.subject.id,
          date,
          status,
          remark: rec?.remark,
          markedById: p.userId,
        });
      }
      if (rows.length) await tx.attendance.createMany({ data: rows });
      await this.audit.log(
        {
          collegeId: c,
          userId: p.userId,
          action: 'ATTENDANCE_MARK',
          entity: 'AttendanceSession',
          entityId: session.id,
          newValue: { date, periodKey, created: rows.length, skipped: skipped.length },
        },
        tx,
      );
    });

    if (rows.length) {
      const payload: AttendanceUpdatedEvent = {
        collegeId: c,
        studentIds: rows.map((r) => r.studentId),
        subjectId: offering.subject.id,
        actorId: p.userId,
      };
      this.events.emit(DomainEvents.AttendanceUpdated, payload);
      // live attendance session: teachers/HODs subscribed to this offering see progress instantly
      this.events.emit(REALTIME_EMIT, {
        room: `offering:${offering.id}`,
        event: 'attendance.marked',
        data: { subjectOfferingId: offering.id, date, periodKey, created: rows.length },
      });
    }
    return { sessionId: sessionIdHolder.id, created: rows.length, skippedAlreadyMarked: skipped };
  }

  async getSession(p: Principal, c: string, offeringId: string, date: Date) {
    await this.access.assertManagesOffering(p, c, offeringId);
    const sessions = await this.prisma.attendanceSession.findMany({
      where: { collegeId: c, subjectOfferingId: offeringId, date: startOfUtcDay(date) },
      include: { records: { select: { id: true, studentId: true, status: true, remark: true, version: true } } },
    });
    return sessions;
  }

  // ───────── correction workflow ─────────
  async requestCorrection(p: Principal, c: string, dto: D.CorrectionRequestDto) {
    const att = await this.prisma.attendance.findFirst({
      where: { id: dto.attendanceId, collegeId: c },
      include: { session: { include: { subjectOffering: { include: { subject: true } } } } },
    });
    if (!att) throw new NotFoundException('Attendance record not found');
    await this.access.assertManagesOffering(p, c, att.session.subjectOfferingId);
    if (att.status === dto.newStatus) throw new BadRequestException('New status equals current status');
    if (
      await this.prisma.attendanceCorrection.count({
        where: { attendanceId: att.id, status: CorrectionStatus.PENDING },
      })
    ) {
      throw new ConflictException({
        message: 'A correction is already pending for this record',
        errorCode: 'CORRECTION_PENDING',
      });
    }
    const existingPending = await this.prisma.attendanceCorrection.findFirst({
      where: { attendanceId: att.id, status: CorrectionStatus.PENDING },
    });
    if (existingPending) {
      throw new ConflictException({
        message: 'A pending correction request already exists for this attendance record',
        errorCode: 'PENDING_CORRECTION_EXISTS',
      });
    }

    const correction = await this.prisma.attendanceCorrection.create({
      data: {
        collegeId: c,
        attendanceId: att.id,
        requestedById: p.userId,
        oldStatus: att.status,
        newStatus: dto.newStatus,
        reason: dto.reason,
      },
    });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'ATTENDANCE_CORRECTION_REQUEST',
      entity: 'AttendanceCorrection',
      entityId: correction.id,
      oldValue: { status: att.status },
      newValue: { status: dto.newStatus },
      reason: dto.reason,
    });

    const hodIds = await this.reviewerUserIds(c, att.session.subjectOffering.subject.departmentId);
    this.notify({
      collegeId: c,
      userIds: hodIds,
      type: 'AttendanceCorrectionRequested',
      title: 'Attendance correction awaiting review',
      body: `A correction for ${att.session.subjectOffering.subject.name} needs your decision.`,
      data: { correctionId: correction.id },
    });
    return correction;
  }

  async listCorrections(p: Principal, c: string, q: D.CorrectionListQueryDto) {
    const scope: Prisma.AttendanceCorrectionWhereInput = isAdmin(p)
      ? {}
      : p.departmentIds.length && p.roleKeys.includes('HOD')
        ? {
            OR: [
              { requestedById: p.userId },
              { attendance: { session: { subjectOffering: { subject: { departmentId: { in: p.departmentIds } } } } } },
            ],
          }
        : { requestedById: p.userId };
    const studentFilter: Prisma.AttendanceCorrectionWhereInput = q.studentId
      ? { attendance: { studentId: q.studentId } }
      : {};
    const where: Prisma.AttendanceCorrectionWhereInput = { AND: [{ collegeId: c, status: q.status }, scope, studentFilter] };
    const [items, total] = await Promise.all([
      this.prisma.attendanceCorrection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(q),
        include: {
          attendance: { select: { date: true, studentId: true, subjectId: true } },
          requestedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.attendanceCorrection.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async reviewCorrection(p: Principal, c: string, id: string, dto: D.ReviewCorrectionDto) {
    const corr = await this.prisma.attendanceCorrection.findFirst({
      where: { id, collegeId: c },
      include: {
        attendance: {
          include: {
            session: { include: { subjectOffering: { include: { subject: true } } } },
            student: { select: { userId: true } },
          },
        },
      },
    });
    if (!corr) throw new NotFoundException('Correction not found');
    const subject = corr.attendance.session.subjectOffering.subject;
    if (!this.access.canReviewDepartment(p, subject.departmentId))
      throw new ForbiddenException({
        message: 'Only the HOD of this department or an admin can review',
        errorCode: 'SCOPE_DENIED',
      });
    if (corr.requestedById === p.userId)
      throw new ForbiddenException({ message: 'You cannot review your own request', errorCode: 'SELF_REVIEW' });

    const status = dto.approve ? CorrectionStatus.APPROVED : CorrectionStatus.REJECTED;
    await this.prisma.$transaction(async (tx) => {
      // Guard against double-review races: only a PENDING row can transition.
      const moved = await tx.attendanceCorrection.updateMany({
        where: { id, status: CorrectionStatus.PENDING },
        data: { status, reviewedById: p.userId, reviewNote: dto.note, reviewedAt: new Date() },
      });
      if (moved.count !== 1)
        throw new ConflictException({ message: 'Correction already reviewed', errorCode: 'ALREADY_REVIEWED' });
      if (dto.approve) {
        await tx.attendance.update({
          where: { id: corr.attendanceId },
          data: { status: corr.newStatus, version: { increment: 1 } },
        });
      }
      await this.audit.log(
        {
          collegeId: c,
          userId: p.userId,
          action: dto.approve ? 'ATTENDANCE_CORRECTION_APPROVED' : 'ATTENDANCE_CORRECTION_REJECTED',
          entity: 'Attendance',
          entityId: corr.attendanceId,
          oldValue: { status: corr.oldStatus },
          newValue: { status: dto.approve ? corr.newStatus : corr.oldStatus },
          reason: dto.note ?? corr.reason,
        },
        tx,
      );
    });

    this.notify({
      collegeId: c,
      userIds: [corr.requestedById],
      type: 'AttendanceCorrectionReviewed',
      title: `Attendance correction ${status.toLowerCase()}`,
      body: dto.note ?? `Your correction for ${subject.name} was ${status.toLowerCase()}.`,
      data: { correctionId: id },
    });
    if (dto.approve) {
      this.notify({
        collegeId: c,
        userIds: [corr.attendance.student.userId],
        type: 'AttendanceChanged',
        title: 'Your attendance was updated',
        body: `${subject.name}: ${corr.oldStatus} → ${corr.newStatus}.`,
        data: { attendanceId: corr.attendanceId },
      });
      const payload: AttendanceUpdatedEvent = {
        collegeId: c,
        studentIds: [corr.attendance.studentId],
        subjectId: subject.id,
        actorId: p.userId,
      };
      this.events.emit(DomainEvents.AttendanceUpdated, payload);
    }
    return this.prisma.attendanceCorrection.findUniqueOrThrow({ where: { id } });
  }

  // ───────── student-facing reads ─────────
  async studentRecords(c: string, studentId: string, q: D.AttendanceQueryDto) {
    const where: Prisma.AttendanceWhereInput = {
      collegeId: c,
      studentId,
      subjectId: q.subjectId,
      date: { gte: q.from, lte: q.to },
    };
    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        ...toSkipTake(q),
        select: {
          id: true,
          date: true,
          status: true,
          remark: true,
          version: true,
          subjectId: true,
          session: {
            select: {
              periodKey: true,
              subjectOffering: { select: { subject: { select: { name: true, code: true } } } },
            },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  private async reviewerUserIds(c: string, departmentId: string): Promise<string[]> {
    const [dept, admins] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: departmentId }, select: { hodUserId: true } }),
      this.prisma.userRole.findMany({
        where: { role: { collegeId: c, key: 'HOD' }, departmentId },
        select: { userId: true },
      }),
    ]);
    return [...new Set([dept?.hodUserId, ...admins.map((a) => a.userId)].filter((x): x is string => !!x))];
  }
  private notify(e: NotifyUsersEvent) {
    if (e.userIds.length) this.events.emit(NOTIFY, e);
  }
}

export type { PaginationQueryDto, AttendanceStatus };
