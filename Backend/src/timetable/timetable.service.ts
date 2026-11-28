import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessService, isAdmin } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { Conflict, SlotLike, findConflicts } from './conflicts';
import * as D from './dto/timetable.dto';

const SLOT_INCLUDE = {
  room: { select: { code: true } },
  subjectOffering: {
    select: {
      sectionId: true,
      teacherId: true,
      subject: { select: { name: true, code: true } },
      teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  },
} satisfies Prisma.TimetableSlotInclude;

@Injectable()
export class TimetableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  /** Conflicts for a prospective slot (also used for the dry-run endpoint). */
  async check(
    p: Principal,
    c: string,
    dto: D.CreateSlotDto,
    excludeSlotId?: string,
    overrideTeacherId?: string,
  ): Promise<{ conflicts: Conflict[]; warnings: string[] }> {
    if (dto.endMinute <= dto.startMinute) throw new BadRequestException('endMinute must be after startMinute');
    await this.own.assert('subjectOffering', dto.subjectOfferingId, c);
    await this.own.assert('room', dto.roomId, c);
    const offering = await this.prisma.subjectOffering.findFirstOrThrow({
      where: { id: dto.subjectOfferingId, collegeId: c },
      include: { subject: true },
    });
    const effectiveTeacherId = overrideTeacherId ?? offering.teacherId;
    if (p.roleKeys.includes(ROLE.HOD) && !isAdmin(p)) {
      if (!p.departmentIds.includes(offering.subject.departmentId)) {
        throw new ForbiddenException('Cannot manage timetable for outside departments');
      }
    }
    const existing = await this.prisma.timetableSlot.findMany({
      where: {
        collegeId: c,
        dayOfWeek: dto.dayOfWeek,
        id: excludeSlotId ? { not: excludeSlotId } : undefined,
        OR: [
          { subjectOffering: { sectionId: offering.sectionId } },
          { subjectOffering: { teacherId: effectiveTeacherId } },
          ...(dto.roomId ? [{ roomId: dto.roomId }] : []),
        ],
      },
      include: { subjectOffering: { select: { sectionId: true, teacherId: true } } },
    });
    const toLike = (s: (typeof existing)[number]): SlotLike => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startMinute: s.startMinute,
      endMinute: s.endMinute,
      sectionId: s.subjectOffering.sectionId,
      teacherId: s.subjectOffering.teacherId,
      roomId: s.roomId,
      validFrom: s.validFrom,
      validTo: s.validTo,
    });
    const availability = await this.prisma.teacherAvailability.findMany({ where: { teacherId: effectiveTeacherId } });
    const conflicts = findConflicts(
      {
        dayOfWeek: dto.dayOfWeek,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
        sectionId: offering.sectionId,
        teacherId: effectiveTeacherId,
        roomId: dto.roomId,
        validFrom: dto.validFrom,
        validTo: dto.validTo,
      },
      existing.map(toLike),
      availability,
    );
    const warnings: string[] = [];
    if (dto.roomId) {
      const [room, size] = await Promise.all([
        this.prisma.room.findUniqueOrThrow({ where: { id: dto.roomId } }),
        this.prisma.enrollment.count({ where: { subjectOfferingId: offering.id } }),
      ]);
      if (size > room.capacity) warnings.push(`Room capacity ${room.capacity} is smaller than enrolment ${size}`);
    }
    return { conflicts, warnings };
  }

  async create(p: Principal, c: string, dto: D.CreateSlotDto) {
    const { conflicts, warnings } = await this.check(p, c, dto);
    if (conflicts.length)
      throw new ConflictException({ message: 'Timetable conflict', errorCode: 'TIMETABLE_CONFLICT', conflicts });
    const slot = await this.prisma.timetableSlot.create({ data: { ...dto, collegeId: c }, include: SLOT_INCLUDE });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'TIMETABLE_CREATE',
      entity: 'TimetableSlot',
      entityId: slot.id,
      newValue: dto,
    });
    return { slot, warnings };
  }

  async update(p: Principal, c: string, id: string, dto: D.UpdateSlotDto) {
    await this.own.assert('timetableSlot', id, c);
    const existing = await this.prisma.timetableSlot.findFirst({
      where: { id, collegeId: c },
      include: { subjectOffering: { include: { subject: true } } },
    });
    if (!existing) throw new NotFoundException('Timetable slot not found');
    if (p.roleKeys.includes(ROLE.HOD) && !isAdmin(p)) {
      if (!p.departmentIds.includes(existing.subjectOffering.subject.departmentId)) {
        throw new ForbiddenException('Cannot manage timetable for outside departments');
      }
    }
    if (dto.teacherId) {
      await this.own.assert('teacher', dto.teacherId, c);
    }

    const merged: D.CreateSlotDto = {
      subjectOfferingId: dto.subjectOfferingId ?? existing.subjectOfferingId,
      roomId: dto.roomId !== undefined ? dto.roomId : existing.roomId ?? undefined,
      dayOfWeek: dto.dayOfWeek ?? existing.dayOfWeek,
      startMinute: dto.startMinute ?? existing.startMinute,
      endMinute: dto.endMinute ?? existing.endMinute,
      validFrom: dto.validFrom ?? existing.validFrom,
      validTo: dto.validTo !== undefined ? dto.validTo : existing.validTo ?? undefined,
    };

    const { conflicts, warnings } = await this.check(p, c, merged, id, dto.teacherId);
    if (conflicts.length) {
      throw new ConflictException({ message: 'Timetable conflict', errorCode: 'TIMETABLE_CONFLICT', conflicts });
    }
    if (dto.teacherId && dto.teacherId !== existing.subjectOffering.teacherId) {
      await this.prisma.subjectOffering.update({
        where: { id: existing.subjectOfferingId },
        data: { teacherId: dto.teacherId },
      });
    }
    const updated = await this.prisma.timetableSlot.update({
      where: { id },
      data: {
        subjectOfferingId: merged.subjectOfferingId,
        roomId: merged.roomId ?? null,
        dayOfWeek: merged.dayOfWeek,
        startMinute: merged.startMinute,
        endMinute: merged.endMinute,
        validFrom: merged.validFrom,
        validTo: merged.validTo ?? null,
      },
      include: SLOT_INCLUDE,
    });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'TIMETABLE_UPDATE',
      entity: 'TimetableSlot',
      entityId: id,
      oldValue: {
        dayOfWeek: existing.dayOfWeek,
        startMinute: existing.startMinute,
        endMinute: existing.endMinute,
        roomId: existing.roomId,
        validTo: existing.validTo,
      },
      newValue: dto,
    });
    return { slot: updated, warnings };
  }

  async remove(p: Principal, c: string, id: string) {
    await this.own.assert('timetableSlot', id, c);
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { id, collegeId: c },
      include: { subjectOffering: { include: { subject: true } } },
    });
    if (!slot) throw new NotFoundException();
    if (p.roleKeys.includes(ROLE.HOD) && !isAdmin(p)) {
      if (!p.departmentIds.includes(slot.subjectOffering.subject.departmentId)) {
        throw new ForbiddenException('Cannot remove timetable for outside departments');
      }
    }
    await this.prisma.timetableSlot.delete({ where: { id } });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'TIMETABLE_DELETE',
      entity: 'TimetableSlot',
      entityId: id,
    });
  }

  forSection(c: string, sectionId: string) {
    const now = new Date();
    return this.prisma.timetableSlot.findMany({
      where: {
        collegeId: c,
        subjectOffering: { sectionId },
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }
  forStudent(c: string, studentId: string) {
    const now = new Date();
    return this.prisma.timetableSlot.findMany({
      where: {
        collegeId: c,
        subjectOffering: { enrollments: { some: { studentId } } },
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }
  forTeacher(p: Principal, c: string) {
    if (!p.teacherId) throw new ForbiddenException('Not a teacher account');
    const now = new Date();
    return this.prisma.timetableSlot.findMany({
      where: {
        collegeId: c,
        subjectOffering: { teacherId: p.teacherId },
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      include: SLOT_INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async setAvailability(p: Principal, c: string, teacherId: string, windows: D.AvailabilityDto[]) {
    await this.own.assert('teacher', teacherId, c);
    const teacher = await this.prisma.teacher.findFirst({ where: { id: teacherId, collegeId: c } });
    if (!teacher) throw new NotFoundException();
    if (p.roleKeys.includes(ROLE.HOD) && !isAdmin(p)) {
      if (!p.departmentIds.includes(teacher.departmentId)) {
        throw new ForbiddenException('Cannot manage availability for outside departments');
      }
    }
    for (const w of windows) {
      if (w.endMinute <= w.startMinute) {
        throw new BadRequestException('endMinute must be after startMinute');
      }
    }
    await this.prisma.$transaction([
      this.prisma.teacherAvailability.deleteMany({ where: { teacherId } }),
      this.prisma.teacherAvailability.createMany({ data: windows.map((w) => ({ ...w, teacherId })) }),
    ]);
    return { windows: windows.length };
  }
  async createRoom(c: string, dto: D.CreateRoomDto) {
    await this.own.assert('campus', dto.campusId, c);
    return this.prisma.room.create({ data: { ...dto, collegeId: c } });
  }
  listRooms(c: string) {
    return this.prisma.room.findMany({ where: { collegeId: c }, orderBy: { code: 'asc' } });
  }

  private assertSlotExceptionAccess(
    p: Principal,
    slot: { subjectOffering: { teacherId: string; subject: { departmentId: string } } },
  ) {
    if (isAdmin(p)) return;
    if (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.includes(slot.subjectOffering.subject.departmentId)) return;
    if (p.teacherId && slot.subjectOffering.teacherId === p.teacherId) return;
    throw new ForbiddenException('You are not authorized to modify this lecture date');
  }

  async createException(p: Principal, c: string, dto: D.CreateTimetableExceptionDto) {
    await this.own.assert('timetableSlot', dto.slotId, c);
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { id: dto.slotId, collegeId: c },
      include: { subjectOffering: { include: { subject: true } } },
    });
    if (!slot) throw new NotFoundException('Timetable slot not found');
    this.assertSlotExceptionAccess(p, slot);

    const rawDate = new Date(dto.date);
    const targetDate = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));

    if (dto.substituteTeacherId) {
      if (!isAdmin(p) && !p.roleKeys.includes(ROLE.HOD)) {
        throw new ForbiddenException('Only HOD or admin may assign a substitute teacher');
      }
      await this.own.assert('teacher', dto.substituteTeacherId, c);
    }
    if (dto.overrideRoomId) {
      await this.own.assert('room', dto.overrideRoomId, c);
    }

    if (dto.type !== 'CANCELLED') {
      const startMinute = dto.overrideStartMinute ?? slot.startMinute;
      const endMinute = dto.overrideEndMinute ?? slot.endMinute;
      if (endMinute <= startMinute) throw new BadRequestException('overrideEndMinute must be after overrideStartMinute');

      const { conflicts } = await this.check(
        p,
        c,
        {
          subjectOfferingId: slot.subjectOfferingId,
          roomId: dto.overrideRoomId !== undefined ? dto.overrideRoomId : slot.roomId ?? undefined,
          dayOfWeek: slot.dayOfWeek,
          startMinute,
          endMinute,
          validFrom: targetDate,
          validTo: targetDate,
        },
        slot.id,
        dto.substituteTeacherId,
      );
      if (conflicts.length) {
        throw new ConflictException({ message: 'Reschedule / substitution conflict', errorCode: 'TIMETABLE_CONFLICT', conflicts });
      }
    }

    const exception = await this.prisma.timetableException.upsert({
      where: { slotId_date: { slotId: slot.id, date: targetDate } },
      create: {
        collegeId: c,
        slotId: slot.id,
        date: targetDate,
        type: dto.type,
        substituteTeacherId: dto.substituteTeacherId ?? null,
        overrideRoomId: dto.overrideRoomId ?? null,
        overrideStartMinute: dto.overrideStartMinute ?? null,
        overrideEndMinute: dto.overrideEndMinute ?? null,
        reason: dto.reason.trim(),
        createdById: p.userId,
      },
      update: {
        type: dto.type,
        substituteTeacherId: dto.substituteTeacherId ?? null,
        overrideRoomId: dto.overrideRoomId ?? null,
        overrideStartMinute: dto.overrideStartMinute ?? null,
        overrideEndMinute: dto.overrideEndMinute ?? null,
        reason: dto.reason.trim(),
      },
      include: {
        substituteTeacher: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
        overrideRoom: { select: { id: true, code: true } },
      },
    });

    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'TIMETABLE_EXCEPTION_SET',
      entity: 'TimetableException',
      entityId: exception.id,
      newValue: { slotId: slot.id, date: targetDate.toISOString().split('T')[0], type: dto.type, reason: dto.reason },
    });
    return exception;
  }

  async listExceptions(p: Principal, c: string, q: D.ExceptionQueryDto) {
    const rawDate = q.date ? new Date(q.date) : null;
    const targetDate = rawDate
      ? new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()))
      : undefined;
    const scope: Prisma.TimetableExceptionWhereInput = isAdmin(p)
      ? {}
      : p.roleKeys.includes(ROLE.HOD) && p.departmentIds.length
        ? { slot: { subjectOffering: { subject: { departmentId: { in: p.departmentIds } } } } }
        : p.teacherId
          ? { OR: [{ slot: { subjectOffering: { teacherId: p.teacherId } } }, { substituteTeacherId: p.teacherId }] }
          : p.studentId
            ? { slot: { subjectOffering: { enrollments: { some: { studentId: p.studentId } } } } }
            : { createdById: p.userId };

    return this.prisma.timetableException.findMany({
      where: {
        collegeId: c,
        ...(targetDate ? { date: targetDate } : {}),
        ...(q.slotId ? { slotId: q.slotId } : {}),
        ...scope,
      },
      include: {
        substituteTeacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        overrideRoom: { select: { id: true, code: true } },
        slot: { include: { subjectOffering: { include: { subject: { select: { code: true, name: true } }, section: { select: { name: true } } } } } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async removeException(p: Principal, c: string, id: string) {
    const existing = await this.prisma.timetableException.findFirst({
      where: { id, collegeId: c },
      include: { slot: { include: { subjectOffering: { include: { subject: true } } } } },
    });
    if (!existing) throw new NotFoundException('Timetable exception not found');
    this.assertSlotExceptionAccess(p, existing.slot);
    await this.prisma.timetableException.delete({ where: { id } });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'TIMETABLE_EXCEPTION_DELETE',
      entity: 'TimetableException',
      entityId: id,
    });
  }
}
