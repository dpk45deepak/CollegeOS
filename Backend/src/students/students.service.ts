import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as D from './dto/students.dto';

export const STUDENT_INCLUDE = {
  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
  department: { select: { id: true, code: true, name: true } },
  program: { select: { id: true, code: true, name: true } },
  batch: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  semester: { select: { id: true, number: true, academicYear: true } },
} satisfies Prisma.StudentInclude;

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly own: OwnershipService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async create(c: string, dto: D.CreateStudentDto, actorId: string) {
    await this.own.assert('department', dto.departmentId, c);
    await this.own.assert('program', dto.programId, c);
    await this.own.assert('batch', dto.batchId, c);
    await this.own.assert('section', dto.sectionId, c);
    await this.own.assert('semester', dto.semesterId, c);

    const student = await this.prisma.$transaction(async (tx) => {
      const user = await this.users.create(
        c,
        {
          loginId: dto.collegeStudentId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          roles: [ROLE.STUDENT],
          initialPassword: dto.initialPassword,
        },
        actorId,
        tx,
      );
      return tx.student.create({
        data: {
          collegeId: c,
          userId: user.id,
          collegeStudentId: dto.collegeStudentId,
          rollNumber: dto.rollNumber,
          departmentId: dto.departmentId,
          programId: dto.programId,
          batchId: dto.batchId,
          sectionId: dto.sectionId,
          semesterId: dto.semesterId,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          address: dto.address,
          guardians: { create: dto.guardians ?? [] },
        },
        include: STUDENT_INCLUDE,
      });
    });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'STUDENT_CREATE',
      entity: 'Student',
      entityId: student.id,
    });
    return student;
  }

  async list(p: Principal, c: string, q: D.StudentListQueryDto) {
    const where: Prisma.StudentWhereInput = {
      AND: [
        this.access.studentWhere(p, c),
        {
          departmentId: q.departmentId,
          programId: q.programId,
          batchId: q.batchId,
          sectionId: q.sectionId,
          ...(q.search
            ? {
                OR: [
                  { collegeStudentId: { contains: q.search, mode: 'insensitive' } },
                  { rollNumber: { contains: q.search, mode: 'insensitive' } },
                  { user: { firstName: { contains: q.search, mode: 'insensitive' } } },
                  { user: { lastName: { contains: q.search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: STUDENT_INCLUDE,
        orderBy: { rollNumber: 'asc' },
        ...toSkipTake(q),
      }),
      this.prisma.student.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async get(p: Principal, c: string, id: string) {
    const s = await this.prisma.student.findFirst({
      where: { AND: [this.access.studentWhere(p, c), { id }] },
      include: { ...STUDENT_INCLUDE, guardians: true, skills: true, portfolio: true },
    });
    if (!s) throw new NotFoundException('Student not found');
    return s;
  }

  me(p: Principal, c: string) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    return this.get(p, c, p.studentId);
  }

  async updateMe(p: Principal, c: string, dto: D.UpdateMyProfileDto) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    if (dto.phone !== undefined) await this.prisma.user.update({ where: { id: p.userId }, data: { phone: dto.phone } });
    if (dto.address) await this.prisma.student.update({ where: { id: p.studentId }, data: { address: dto.address } });
    return this.me(p, c);
  }

  async update(c: string, id: string, dto: D.UpdateStudentDto, actorId: string) {
    await this.own.assert('student', id, c);
    await this.own.assert('department', dto.departmentId, c);
    await this.own.assert('program', dto.programId, c);
    await this.own.assert('batch', dto.batchId, c);
    await this.own.assert('section', dto.sectionId, c);
    await this.own.assert('semester', dto.semesterId, c);
    const before = await this.prisma.student.findUniqueOrThrow({ where: { id } });
    const { firstName, lastName, phone, ...rest } = dto;
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    if (firstName || lastName || phone)
      await this.prisma.user.update({ where: { id: student.userId }, data: { firstName, lastName, phone } });
    const after = await this.prisma.student.update({ where: { id }, data: rest, include: STUDENT_INCLUDE });
    await this.audit.log({
      collegeId: c,
      userId: actorId,
      action: 'STUDENT_UPDATE',
      entity: 'Student',
      entityId: id,
      oldValue: before,
      newValue: dto,
    });
    return after;
  }

  async addSkill(p: Principal, dto: D.AddSkillDto) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    return this.prisma.studentSkill.upsert({
      where: { studentId_name: { studentId: p.studentId, name: dto.name.trim().toLowerCase() } },
      update: { level: dto.level },
      create: { studentId: p.studentId, name: dto.name.trim().toLowerCase(), level: dto.level },
    });
  }
  async removeSkill(p: Principal, name: string) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    await this.prisma.studentSkill.deleteMany({ where: { studentId: p.studentId, name: name.toLowerCase() } });
  }
  addPortfolio(p: Principal, dto: D.AddPortfolioItemDto) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    return this.prisma.studentPortfolioItem.create({ data: { ...dto, studentId: p.studentId, tags: dto.tags ?? [] } });
  }
  async removePortfolio(p: Principal, id: string) {
    if (!p.studentId) throw new ForbiddenException('Not a student account');
    const r = await this.prisma.studentPortfolioItem.deleteMany({ where: { id, studentId: p.studentId } });
    if (!r.count) throw new NotFoundException();
  }
}
