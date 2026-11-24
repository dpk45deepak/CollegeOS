import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { OwnershipService } from '../access/ownership.service';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PrincipalService } from '../security/principal.service';
import { AssignRolesDto, CreateUserDto } from './dto/users.dto';

const PUBLIC_USER = {
  id: true,
  collegeId: true,
  loginId: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly principals: PrincipalService,
    private readonly own: OwnershipService,
  ) {}

  async sendVerification(userId: string) {
    return this.auth.sendVerification(userId);
  }

  /** Creates a user inside a tenant. Reused by student/teacher onboarding. */
  async create(collegeId: string, dto: CreateUserDto, actorId?: string, tx?: Prisma.TransactionClient) {
    if (dto.departmentIds?.length) {
      await this.own.assert('department', dto.departmentIds, collegeId);
    }
    const db = tx ?? this.prisma;
    const roles = await db.role.findMany({ where: { collegeId, key: { in: dto.roles } } });
    if (roles.length !== new Set(dto.roles).size) throw new BadRequestException('Unknown role in request');
    const dup = await db.user.findFirst({
      where: { collegeId, OR: [{ loginId: dto.loginId }, { email: dto.email.toLowerCase() }] },
      select: { id: true },
    });
    if (dup) throw new ConflictException({ message: 'loginId or email already in use', errorCode: 'USER_EXISTS' });

    const hasPassword = !!dto.initialPassword;
    const user = await db.user.create({
      data: {
        collegeId,
        loginId: dto.loginId,
        email: dto.email.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        passwordHash: await this.auth.hashPassword(dto.initialPassword ?? randomBytes(24).toString('base64url')),
        status: hasPassword ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: hasPassword ? new Date() : null,
        userRoles: {
          create: roles.flatMap((r) =>
            dto.departmentIds?.length
              ? dto.departmentIds.map((departmentId) => ({ roleId: r.id, departmentId }))
              : [{ roleId: r.id }],
          ),
        },
      },
      select: PUBLIC_USER,
    });
    await this.audit.log(
      {
        collegeId,
        userId: actorId,
        action: 'USER_CREATE',
        entity: 'User',
        entityId: user.id,
        newValue: { ...user, roles: dto.roles },
      },
      tx,
    );
    if (!hasPassword && !tx) await this.auth.sendVerification(user.id);
    return user;
  }

  async list(collegeId: string, q: PaginationQueryDto, search?: string) {
    const where: Prisma.UserWhereInput = {
      collegeId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { loginId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: PUBLIC_USER, orderBy: { createdAt: 'desc' }, ...toSkipTake(q) }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, q);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...PUBLIC_USER, userRoles: { select: { role: { select: { key: true } }, departmentId: true } } },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async assignRoles(collegeId: string, userId: string, dto: AssignRolesDto, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, collegeId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const roles = await this.prisma.role.findMany({ where: { collegeId, key: { in: dto.roles } } });
    if (roles.length !== new Set(dto.roles).size) throw new BadRequestException('Unknown role in request');
    if (dto.departmentIds?.length) {
      await this.own.assert('department', dto.departmentIds, collegeId);
    }
    const before = user.userRoles.map((ur) => ur.role.key);
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roles.flatMap((r) =>
          dto.departmentIds?.length
            ? dto.departmentIds.map((departmentId) => ({ userId, roleId: r.id, departmentId }))
            : [{ userId, roleId: r.id }],
        ),
      });
      await this.audit.log(
        {
          collegeId,
          userId: actorId,
          action: 'ROLES_ASSIGN',
          entity: 'User',
          entityId: userId,
          oldValue: before,
          newValue: dto.roles,
        },
        tx,
      );
    });
    await this.principals.invalidate(userId);
    return this.me(userId);
  }

  async setStatus(collegeId: string, userId: string, status: UserStatus, actorId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, collegeId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === actorId) throw new BadRequestException('You cannot change your own status');
    await this.prisma.user.update({ where: { id: userId }, data: { status } });
    if (status !== UserStatus.ACTIVE) await this.auth.logoutAll(userId);
    await this.principals.invalidate(userId);
    await this.audit.log({
      collegeId,
      userId: actorId,
      action: 'USER_STATUS',
      entity: 'User',
      entityId: userId,
      oldValue: user.status,
      newValue: status,
    });
  }
}
