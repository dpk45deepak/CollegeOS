import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus, Prisma } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as D from './dto/teachers.dto';

const TEACHER_INCLUDE = {
  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
  department: { select: { id: true, code: true, name: true } },
} satisfies Prisma.TeacherInclude;

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly own: OwnershipService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(c: string, dto: D.CreateTeacherDto, actorId: string) {
    await this.own.assert('department', dto.departmentId, c);
    const teacher = await this.prisma.$transaction(async (tx) => {
      const roles = dto.isHod ? [ROLE.TEACHER, ROLE.HOD] : [ROLE.TEACHER];
      const user = await this.users.create(
        c,
        {
          loginId: dto.employeeId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          roles,
          departmentIds: [dto.departmentId],
          initialPassword: dto.initialPassword,
        },
        actorId,
        tx,
      );
      const t = await tx.teacher.create({
        data: {
          collegeId: c,
          userId: user.id,
          employeeId: dto.employeeId,
          departmentId: dto.departmentId,
          designation: dto.designation,
          qualifications: dto.qualifications,
        },
        include: TEACHER_INCLUDE,
      });
      if (dto.isHod) await tx.department.update({ where: { id: dto.departmentId }, data: { hodUserId: user.id } });
      return t;
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'TEACHER_CREATE',
      entity: 'Teacher',
      entityId: teacher.id,
    });
    return teacher;
  }

  async list(c: string, q: PaginationQueryDto, departmentId?: string) {
    const where = { collegeId: c, departmentId };
    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        include: TEACHER_INCLUDE,
        orderBy: { employeeId: 'asc' },
        ...toSkipTake(q),
      }),
      this.prisma.teacher.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async me(p: Principal) {
    if (!p.teacherId) throw new ForbiddenException('Not a teacher account');
    return this.prisma.teacher.findUniqueOrThrow({ where: { id: p.teacherId }, include: TEACHER_INCLUDE });
  }

  // ── subject offerings ───────────────────────────────
  async createOffering(c: string, dto: D.CreateOfferingDto, actorId: string) {
    await Promise.all([
      this.own.assert('subject', dto.subjectId, c),
      this.own.assert('semester', dto.semesterId, c),
      this.own.assert('section', dto.sectionId, c),
      this.own.assert('teacher', dto.teacherId, c),
    ]);
    const section = await this.prisma.section.findFirstOrThrow({ where: { id: dto.sectionId, collegeId: c } });
    if (section.semesterId !== dto.semesterId)
      throw new BadRequestException('Section does not belong to that semester');
    try {
      const offering = await this.prisma.subjectOffering.create({
        data: {
          collegeId: c,
          subjectId: dto.subjectId,
          semesterId: dto.semesterId,
          sectionId: dto.sectionId,
          teacherId: dto.teacherId,
        },
      });
      if (dto.enrollSection !== false) {
        const students = await this.prisma.student.findMany({
          where: { collegeId: c, sectionId: dto.sectionId },
          select: { id: true },
        });
        await this.prisma.enrollment.createMany({
          data: students.map((s) => ({ collegeId: c, studentId: s.id, subjectOfferingId: offering.id })),
          skipDuplicates: true,
        });
      }
      await this.audit.log({
        collegeId: c,
        userId: actorId,
        action: 'OFFERING_CREATE',
        entity: 'SubjectOffering',
        entityId: offering.id,
        newValue: dto,
      });
      return offering;
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002')
        throw new ConflictException('That subject is already offered to this section');
      throw e;
    }
  }

  async listOfferings(p: Principal, c: string, q: PaginationQueryDto, sectionId?: string) {
    const where: Prisma.SubjectOfferingWhereInput = { AND: [this.access.offeringWhere(p, c), { sectionId }] };
    const [items, total] = await Promise.all([
      this.prisma.subjectOffering.findMany({
        where,
        include: {
          subject: { select: { code: true, name: true } },
          section: { select: { name: true } },
          teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        },
        ...toSkipTake(q),
      }),
      this.prisma.subjectOffering.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async enroll(c: string, offeringId: string, dto: D.EnrollDto, actorId: string) {
    await this.own.assert('subjectOffering', offeringId, c);
    await this.own.assert('student', dto.studentIds, c);
    const r = await this.prisma.enrollment.createMany({
      data: dto.studentIds.map((studentId) => ({ collegeId: c, studentId, subjectOfferingId: offeringId })),
      skipDuplicates: true,
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'ENROLL',
      entity: 'SubjectOffering',
      entityId: offeringId,
      newValue: { count: r.count },
    });
    return { enrolled: r.count };
  }

  /** Students of an offering, only if the caller manages it. */
  async roster(p: Principal, c: string, offeringId: string) {
    await this.access.assertManagesOffering(p, c, offeringId);
    return this.prisma.enrollment
      .findMany({
        where: { subjectOfferingId: offeringId },
        select: {
          student: {
            select: {
              id: true,
              rollNumber: true,
              collegeStudentId: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { student: { rollNumber: 'asc' } },
      })
      .then((rows) => rows.map((r) => r.student));
  }

  // ── leave ───────────────────────────────────────────
  requestLeave(p: Principal, c: string, dto: D.LeaveRequestDto) {
    if (!p.teacherId) throw new ForbiddenException('Not a teacher account');
    if (dto.toDate < dto.fromDate) throw new BadRequestException('toDate before fromDate');
    return this.prisma.leaveRequest.create({ data: { collegeId: c, teacherId: p.teacherId, ...dto } });
  }
  async reviewLeave(p: Principal, c: string, id: string, approve: boolean) {
    const leave = await this.prisma.leaveRequest.findFirst({ where: { id, collegeId: c }, include: { teacher: true } });
    if (!leave) throw new NotFoundException();
    if (!this.access.canReviewDepartment(p, leave.teacher.departmentId))
      throw new ForbiddenException('Not your department');
    if (leave.teacher.userId === p.userId) throw new ForbiddenException('Cannot approve your own leave');
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED, reviewedById: p.userId },
    });
  }
}
