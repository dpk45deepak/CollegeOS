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
  ): Promise<{ conflicts: Conflict[]; warnings: string[] }> {
    if (dto.endMinute <= dto.startMinute) throw new BadRequestException('endMinute must be after startMinute');
    await this.own.assert('subjectOffering', dto.subjectOfferingId, c);
    await this.own.assert('room', dto.roomId, c);
    const offering = await this.prisma.subjectOffering.findFirstOrThrow({
      where: { id: dto.subjectOfferingId, collegeId: c },
      include: { subject: true },
    });
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
          { subjectOffering: { teacherId: offering.teacherId } },
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
    const availability = await this.prisma.teacherAvailability.findMany({ where: { teacherId: offering.teacherId } });
    const conflicts = findConflicts(
      {
        dayOfWeek: dto.dayOfWeek,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
        sectionId: offering.sectionId,
        teacherId: offering.teacherId,
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
}
