import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ALL_PERMISSIONS, ROLE, ROLE_PERMISSIONS, RoleKey } from '../auth/permissions';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upserts the global permission catalog (idempotent). */
  async syncPermissions(): Promise<void> {
    for (const key of ALL_PERMISSIONS) {
      await this.prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, module: key.split('_')[0].toLowerCase() },
      });
    }
  }

  /** Creates the per-college copy of every system role and (re)maps role → permissions. */
  async syncCollegeRoles(collegeId: string): Promise<void> {
    await this.syncPermissions();
    const perms = await this.prisma.permission.findMany();
    const idByKey = new Map(perms.map((p) => [p.key, p.id]));
    for (const key of Object.keys(ROLE_PERMISSIONS) as RoleKey[]) {
      if (key === ROLE.SUPER_ADMIN) continue;
      const role =
        (await this.prisma.role.findFirst({ where: { collegeId, key } })) ??
        (await this.prisma.role.create({ data: { collegeId, key, name: key, isSystem: true } }));
      await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await this.prisma.rolePermission.createMany({
        data: ROLE_PERMISSIONS[key].map((p) => ({ roleId: role.id, permissionId: idByKey.get(p) as string })),
      });
    }
  }

  async ensureSuperAdminRole(): Promise<string> {
    await this.syncPermissions();
    const existing = await this.prisma.role.findFirst({ where: { collegeId: null, key: ROLE.SUPER_ADMIN } });
    if (existing) return existing.id;
    const role = await this.prisma.role.create({
      data: { collegeId: null, key: ROLE.SUPER_ADMIN, name: 'Super Admin', isSystem: true },
    });
    const perms = await this.prisma.permission.findMany();
    await this.prisma.rolePermission.createMany({ data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })) });
    return role.id;
  }
}
