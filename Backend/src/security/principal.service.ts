import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ROLE } from '../auth/permissions';

type CachedPrincipal = Omit<Principal, 'sessionId'> & { status: UserStatus };
const TTL_SECONDS = 60;

@Injectable()
export class PrincipalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private key = (userId: string) => `principal:${userId}`;

  async load(userId: string): Promise<CachedPrincipal | null> {
    const cached = await this.redis.safeGet(this.key(userId));
    if (cached) {
      try {
        return JSON.parse(cached) as CachedPrincipal;
      } catch {
        // invalid cached json fallback
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user) return null;
    const [student, teacher, guardianships] = await Promise.all([
      this.prisma.student.findUnique({ where: { userId }, select: { id: true, departmentId: true } }),
      this.prisma.teacher.findUnique({ where: { userId }, select: { id: true, departmentId: true } }),
      this.prisma.guardian.findMany({ where: { userId }, select: { studentId: true } }),
    ]);

    const roleKeys = [...new Set(user.userRoles.map((ur) => ur.role.key))];
    const permissions = [
      ...new Set(user.userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))),
    ];
    const departmentIds = [
      ...new Set(
        [...user.userRoles.map((ur) => ur.departmentId), student?.departmentId, teacher?.departmentId].filter(
          (d): d is string => !!d,
        ),
      ),
    ];
    const principal: CachedPrincipal = {
      userId,
      collegeId: user.collegeId,
      roleKeys,
      permissions,
      departmentIds,
      studentId: student?.id,
      teacherId: teacher?.id,
      guardianOfStudentIds: guardianships.map((g) => g.studentId),
      isSuperAdmin: roleKeys.includes(ROLE.SUPER_ADMIN),
      status: user.status,
    };
    await this.redis.safeSet(this.key(userId), JSON.stringify(principal), 'EX', TTL_SECONDS);
    return principal;
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.safeDel(this.key(userId));
  }
}
