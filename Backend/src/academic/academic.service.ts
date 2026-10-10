import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { OwnershipService } from '../access/ownership.service';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../security/rbac.service';
import { UsersService } from '../users/users.service';
import { ROLE } from '../auth/permissions';
import * as D from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
    private readonly users: UsersService,
  ) {}

  // ── colleges (tenants) ─────────────────────────────
  async createCollege(actor: Principal, dto: D.CreateCollegeDto) {
    if (!actor.isSuperAdmin) throw new ForbiddenException('Only SUPER_ADMIN can create colleges');
    const code = dto.code.toUpperCase();
    if (await this.prisma.college.findUnique({ where: { code } }))
      throw new ConflictException('College code already exists');
    const college = await this.prisma.college.create({ data: { code, name: dto.name } });
    await this.rbac.syncCollegeRoles(college.id);
    await this.users.create(
      college.id,
      {
        loginId: dto.adminLoginId,
        email: dto.adminEmail,
        firstName: 'College',
        lastName: 'Admin',
        roles: [ROLE.COLLEGE_ADMIN],
        initialPassword: dto.adminPassword,
      },
      actor.userId,
    );
    await this.audit.log({
      collegeId: college.id,
      userId: actor.userId,
      action: 'COLLEGE_CREATE',
      entity: 'College',
      entityId: college.id,
    });
    return college;
  }
  listColleges(actor: Principal) {
    if (!actor.isSuperAdmin) throw new ForbiddenException();
    return this.prisma.college.findMany({ orderBy: { name: 'asc' } });
  }
  currentCollege(collegeId: string) {
    return this.prisma.college.findUniqueOrThrow({ where: { id: collegeId } });
  }
  async updateSettings(collegeId: string, dto: D.UpdateCollegeSettingsDto, actorId: string) {
    const before = await this.currentCollege(collegeId);
    const after = await this.prisma.college.update({ where: { id: collegeId }, data: dto });
    await this.audit.log({
      collegeId,
      userId: actorId,
      action: 'COLLEGE_SETTINGS',
      entity: 'College',
      entityId: collegeId,
      oldValue: before,
      newValue: after,
    });
    return after;
  }

  // ── campus / department / program ──────────────────
  createCampus(c: string, dto: D.CreateCampusDto) {
    return this.prisma.campus.create({ data: { ...dto, collegeId: c } });
  }
  listCampuses(c: string) {
    return this.prisma.campus.findMany({ where: { collegeId: c }, orderBy: { name: 'asc' } });
  }
  async updateCampus(c: string, id: string, dto: D.UpdateCampusDto) {
    await this.own.assert('campus', id, c);
    return this.prisma.campus.update({ where: { id }, data: dto });
  }

  async createDepartment(c: string, dto: D.CreateDepartmentDto) {
    await this.own.assert('campus', dto.campusId, c);
    await this.assertUserInTenant(dto.hodUserId, c);
    return this.prisma.department.create({ data: { ...dto, collegeId: c } });
  }
  listDepartments(c: string) {
    return this.prisma.department.findMany({ where: { collegeId: c }, orderBy: { code: 'asc' } });
  }
  async updateDepartment(c: string, id: string, dto: D.UpdateDepartmentDto) {
    await this.own.assert('department', id, c);
    await this.own.assert('campus', dto.campusId, c);
    await this.assertUserInTenant(dto.hodUserId, c);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  createProgram(c: string, dto: D.CreateProgramDto) {
    return this.prisma.program.create({ data: { ...dto, collegeId: c } });
  }
  listPrograms(c: string) {
    return this.prisma.program.findMany({ where: { collegeId: c }, orderBy: { code: 'asc' } });
  }
  async updateProgram(c: string, id: string, dto: D.UpdateProgramDto) {
    await this.own.assert('program', id, c);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  // ── batch / semester / section ─────────────────────
  async createBatch(c: string, dto: D.CreateBatchDto) {
    if (dto.endYear <= dto.startYear) throw new BadRequestException('endYear must be after startYear');
    await this.own.assert('program', dto.programId, c);
    await this.own.assert('department', dto.departmentId, c);
    return this.prisma.batch.create({ data: { ...dto, collegeId: c } });
  }
  listBatches(c: string, departmentId?: string, programId?: string) {
    return this.prisma.batch.findMany({
      where: { collegeId: c, departmentId, programId },
      orderBy: { startYear: 'desc' },
    });
  }
  async createSemester(c: string, dto: D.CreateSemesterDto) {
    if (dto.endDate <= dto.startDate) throw new BadRequestException('endDate must be after startDate');
    await this.own.assert('batch', dto.batchId, c);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent)
        await tx.semester.updateMany({ where: { batchId: dto.batchId, isCurrent: true }, data: { isCurrent: false } });
      return tx.semester.create({ data: { ...dto, collegeId: c } });
    });
  }
  listSemesters(c: string, batchId?: string) {
    return this.prisma.semester.findMany({ where: { collegeId: c, batchId }, orderBy: { number: 'asc' } });
  }
  async createSection(c: string, dto: D.CreateSectionDto) {
    await this.own.assert('semester', dto.semesterId, c);
    return this.prisma.section.create({ data: { ...dto, collegeId: c } });
  }
  listSections(c: string, semesterId?: string) {
    return this.prisma.section.findMany({ where: { collegeId: c, semesterId }, orderBy: { name: 'asc' } });
  }

  // ── subjects ───────────────────────────────────────
  async createSubject(c: string, dto: D.CreateSubjectDto) {
    await this.own.assert('department', dto.departmentId, c);
    return this.prisma.subject.create({ data: { ...dto, collegeId: c } });
  }
  async listSubjects(c: string, q: PaginationQueryDto, departmentId?: string, search?: string) {
    const where = {
      collegeId: c,
      departmentId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.subject.findMany({ where, orderBy: { code: 'asc' }, ...toSkipTake(q) }),
      this.prisma.subject.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  async updateSubject(c: string, id: string, dto: D.UpdateSubjectDto) {
    await this.own.assert('subject', id, c);
    await this.own.assert('department', dto.departmentId, c);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  private async assertUserInTenant(userId: string | undefined, c: string) {
    if (userId && !(await this.prisma.user.count({ where: { id: userId, collegeId: c } })))
      throw new NotFoundException('user not found');
  }
}
