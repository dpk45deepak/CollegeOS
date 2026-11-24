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

    if (dto.timetableSlotId) {
      const slot = await this.prisma.timetableSlot.findFirst({
        where: { id: dto.timetableSlotId, collegeId: c, subjectOfferingId: offering.id },
      });
      if (!slot) {
        throw new BadRequestException('Timetable slot does not exist or does not match subject offering');
      }
    }

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

  async getTeacherScheduledSessions(p: Principal, c: string, queryDate?: Date) {
    if (!p.teacherId && !isAdmin(p)) {
      throw new ForbiddenException('Only teachers and administrators can view scheduled teaching sessions');
    }
    const targetDate = startOfUtcDay(queryDate ? new Date(queryDate) : new Date());
    const dayOfWeekMap: Record<number, 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT'> = {
      0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
    };
    const dayOfWeek = dayOfWeekMap[targetDate.getUTCDay()];
    const teacherFilter = p.teacherId ? { teacherId: p.teacherId } : {};

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        collegeId: c,
        dayOfWeek: dayOfWeek as any,
        subjectOffering: teacherFilter,
        validFrom: { lte: targetDate },
        OR: [{ validTo: null }, { validTo: { gte: targetDate } }],
      },
      include: {
        subjectOffering: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
            section: { select: { id: true, name: true } },
            semester: { select: { id: true, number: true, academicYear: true } },
            teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
            _count: { select: { enrollments: true } },
          },
        },
        room: { select: { id: true, code: true, capacity: true } },
      },
      orderBy: { startMinute: 'asc' },
    });

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        collegeId: c,
        date: targetDate,
        timetableSlotId: { in: slots.map((s) => s.id) },
      },
      include: {
        _count: { select: { records: true } },
      },
    });
    const sessionMap = new Map(sessions.map((s) => [s.timetableSlotId, s]));

    return slots.map((slot) => {
      const existingSession = sessionMap.get(slot.id);
      const startH = Math.floor(slot.startMinute / 60);
      const startM = slot.startMinute % 60;
      const endH = Math.floor(slot.endMinute / 60);
      const endM = slot.endMinute % 60;

      return {
        slotId: slot.id,
        subjectOfferingId: slot.subjectOfferingId,
        subject: {
          id: slot.subjectOffering.subject.id,
          code: slot.subjectOffering.subject.code,
          name: slot.subjectOffering.subject.name,
        },
        section: {
          id: slot.subjectOffering.section.id,
          name: slot.subjectOffering.section.name,
        },
        semester: {
          id: slot.subjectOffering.semester.id,
          number: slot.subjectOffering.semester.number,
          academicYear: slot.subjectOffering.semester.academicYear,
        },
        teacher: {
          id: slot.subjectOffering.teacher.id,
          name: `${slot.subjectOffering.teacher.user.firstName} ${slot.subjectOffering.teacher.user.lastName}`.trim(),
        },
        room: slot.room ? { id: slot.room.id, code: slot.room.code, capacity: slot.room.capacity } : null,
        date: targetDate.toISOString().split('T')[0],
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        startTime: `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`,
        endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
        enrolledStudents: slot.subjectOffering._count.enrollments,
        isMarked: !!existingSession && existingSession._count.records > 0,
        markedCount: existingSession?._count.records || 0,
        sessionId: existingSession?.id,
      };
    });
  }

  async getScheduledSessionRoster(p: Principal, c: string, slotId: string, queryDate?: Date) {
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { id: slotId, collegeId: c },
      include: {
        subjectOffering: {
          include: {
            subject: { select: { id: true, code: true, name: true } },
            section: { select: { id: true, name: true } },
            semester: { select: { id: true, number: true, academicYear: true } },
          },
        },
        room: { select: { id: true, code: true } },
      },
    });
    if (!slot) throw new NotFoundException('Scheduled lecture slot not found');
    await this.access.assertManagesOffering(p, c, slot.subjectOfferingId);

    const targetDate = startOfUtcDay(queryDate ? new Date(queryDate) : new Date());

    const enrollments = await this.prisma.enrollment.findMany({
      where: { subjectOfferingId: slot.subjectOfferingId, collegeId: c },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, loginId: true } },
          },
        },
      },
      orderBy: [
        { student: { rollNumber: 'asc' } },
        { student: { user: { lastName: 'asc' } } },
      ],
    });

    const existingSession = await this.prisma.attendanceSession.findFirst({
      where: {
        collegeId: c,
        subjectOfferingId: slot.subjectOfferingId,
        date: targetDate,
        OR: [{ timetableSlotId: slot.id }, { periodKey: slot.id }],
      },
      include: {
        records: { select: { id: true, studentId: true, status: true, remark: true } },
      },
    });
    const recordMap = new Map(existingSession?.records.map((r) => [r.studentId, r]) || []);

    const roster = enrollments.map((e) => {
      const rec = recordMap.get(e.studentId);
      const firstName = e.student.user.firstName || '';
      const lastName = e.student.user.lastName || '';
      return {
        studentId: e.studentId,
        rollNumber: e.student.rollNumber || e.student.collegeStudentId || 'ID',
        name: `${firstName} ${lastName}`.trim() || e.student.user.loginId,
        email: e.student.user.email,
        status: rec ? rec.status : 'PRESENT',
        remark: rec?.remark || '',
        isAlreadyMarked: !!rec,
        recordId: rec?.id,
      };
    });

    return {
      session: {
        slotId: slot.id,
        subjectOfferingId: slot.subjectOfferingId,
        subject: slot.subjectOffering.subject,
        section: slot.subjectOffering.section,
        semester: slot.subjectOffering.semester,
        room: slot.room,
        date: targetDate.toISOString().split('T')[0],
        isMarked: !!existingSession && existingSession.records.length > 0,
        markedCount: existingSession?.records.length || 0,
        sessionId: existingSession?.id,
      },
      roster,
    };
  }

  // ───────── correction workflow ─────────
  async requestCorrection(p: Principal, c: string, dto: D.CorrectionRequestDto) {
    let targetAttendanceId = dto.attendanceId;
    if (!targetAttendanceId && p.studentId) {
      const candidate = await this.prisma.attendance.findFirst({
        where: {
          collegeId: c,
          studentId: p.studentId,
          status: { in: ['ABSENT', 'LATE'] },
          ...(dto.date ? { date: startOfUtcDay(new Date(dto.date)) } : {}),
          ...(dto.subjectOfferingId
            ? {
                OR: [
                  { session: { subjectOfferingId: dto.subjectOfferingId } },
                  { subjectId: dto.subjectOfferingId },
                ],
              }
            : {}),
        },
        orderBy: { date: 'desc' },
      });
      if (candidate) targetAttendanceId = candidate.id;
    }
    if (!targetAttendanceId) {
      throw new BadRequestException('Attendance record ID or valid subject offering is required');
    }

    const att = await this.prisma.attendance.findFirst({
      where: { id: targetAttendanceId, collegeId: c },
      include: {
        session: { include: { subjectOffering: { include: { subject: true } } } },
        student: true,
      },
    });
    if (!att) throw new NotFoundException('Attendance record not found');
    if (p.studentId) {
      if (att.studentId !== p.studentId) {
        throw new ForbiddenException({
          message: 'You can only request corrections for your own attendance records',
          errorCode: 'NOT_OWN_ATTENDANCE',
        });
      }
    } else if (!isAdmin(p) && !p.roleKeys.includes('HOD')) {
      await this.access.assertManagesOffering(p, c, att.session.subjectOfferingId);
    }
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
    const teacherUser = await this.prisma.teacher.findUnique({
      where: { id: att.session.subjectOffering.teacherId },
      select: { userId: true },
    });
    const notifyIds = [...new Set([...hodIds, teacherUser?.userId].filter((x): x is string => !!x))];

    this.notify({
      collegeId: c,
      userIds: notifyIds,
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
      : p.studentId
        ? { attendance: { studentId: p.studentId } }
        : p.teacherId
          ? {
              OR: [
                { requestedById: p.userId },
                { attendance: { session: { subjectOffering: { teacherId: p.teacherId } } } },
                ...(p.departmentIds.length && p.roleKeys.includes('HOD')
                  ? [{ attendance: { session: { subjectOffering: { subject: { departmentId: { in: p.departmentIds } } } } } }]
                  : []),
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
          attendance: {
            select: {
              id: true,
              date: true,
              studentId: true,
              subjectId: true,
              status: true,
              session: {
                select: {
                  periodKey: true,
                  subjectOffering: { select: { subject: { select: { name: true, code: true } } } },
                },
              },
              student: {
                select: {
                  rollNumber: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
          requestedBy: { select: { firstName: true, lastName: true } },
          reviewedBy: { select: { firstName: true, lastName: true } },
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
    const offering = corr.attendance.session.subjectOffering;
    const subject = offering.subject;
    const isTeacher = p.teacherId && offering.teacherId === p.teacherId;
    const isHod = this.access.canReviewDepartment(p, subject.departmentId);
    if (!isTeacher && !isHod && !isAdmin(p))
      throw new ForbiddenException({
        message: 'Only the assigned teacher, department HOD, or an admin can review',
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

  async getCorrectionDetail(p: Principal, c: string, id: string) {
    const corr = await this.prisma.attendanceCorrection.findFirst({
      where: { id, collegeId: c },
      include: {
        attendance: {
          include: {
            session: {
              include: {
                subjectOffering: { include: { subject: true, teacher: { include: { user: true } } } },
              },
            },
            student: { include: { user: true } },
          },
        },
        requestedBy: { select: { firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!corr) throw new NotFoundException('Correction not found');
    if (p.studentId && corr.attendance.studentId !== p.studentId) {
      throw new ForbiddenException({ message: 'Access denied', errorCode: 'NOT_OWN_ATTENDANCE' });
    }
    return corr;
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
