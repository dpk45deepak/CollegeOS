import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Principal } from '../types/principal';
import { PermissionsGuard } from './permissions.guard';
import { TenantGuard } from './tenant.guard';

const user = (o: Partial<Principal> = {}): Principal => ({
  userId: 'u',
  collegeId: 'college-A',
  sessionId: 's',
  roleKeys: ['STUDENT'],
  permissions: ['ATTENDANCE_VIEW_OWN'],
  departmentIds: [],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...o,
});
const ctx = (req: Record<string, unknown>) =>
  ({
    getType: () => 'http',
    getHandler: () => 'h',
    getClass: () => 'c',
    switchToHttp: () => ({ getRequest: () => req }),
  }) as unknown as ExecutionContext;
const reflector = (meta: Record<string, unknown>) =>
  ({ getAllAndOverride: (k: string) => meta[k] }) as unknown as Reflector;

describe('PermissionsGuard', () => {
  it('allows when the user holds every required permission', () => {
    expect(
      new PermissionsGuard(reflector({ requiredPermissions: ['ATTENDANCE_VIEW_OWN'] })).canActivate(
        ctx({ user: user() }),
      ),
    ).toBe(true);
  });
  it('denies when any permission is missing (permission-based, not just role-based)', () => {
    const g = new PermissionsGuard(reflector({ requiredPermissions: ['ATTENDANCE_VIEW_OWN', 'ATTENDANCE_MARK'] }));
    expect(() => g.canActivate(ctx({ user: user() }))).toThrow(ForbiddenException);
  });
  it('lets authenticated users through routes with no permission requirement, and public routes through', () => {
    expect(new PermissionsGuard(reflector({})).canActivate(ctx({ user: user() }))).toBe(true);
    expect(new PermissionsGuard(reflector({ isPublic: true })).canActivate(ctx({}))).toBe(true);
  });
});

describe('TenantGuard (tenant isolation)', () => {
  const prisma = {
    college: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        where.id === 'college-B' ? { id: 'college-B' } : null,
      ),
    },
  };
  const guard = () => new TenantGuard(reflector({}), prisma as never);

  it('pins a normal user to their own college', async () => {
    const req: Record<string, unknown> = { user: user(), headers: {} };
    await guard().canActivate(ctx(req));
    expect(req.tenantId).toBe('college-A');
  });
  it('rejects a normal user who sends another college id in x-tenant-id', async () => {
    await expect(
      guard().canActivate(ctx({ user: user(), headers: { 'x-tenant-id': 'college-B' } })),
    ).rejects.toMatchObject({ response: { errorCode: 'TENANT_MISMATCH' } });
  });
  it('lets only SUPER_ADMIN choose a tenant, and only an existing one', async () => {
    const sa = user({ collegeId: null, isSuperAdmin: true, roleKeys: ['SUPER_ADMIN'] });
    const ok: Record<string, unknown> = { user: sa, headers: { 'x-tenant-id': 'college-B' } };
    await guard().canActivate(ctx(ok));
    expect(ok.tenantId).toBe('college-B');
    await expect(guard().canActivate(ctx({ user: sa, headers: { 'x-tenant-id': 'ghost' } }))).rejects.toMatchObject({
      response: { errorCode: 'TENANT_UNKNOWN' },
    });
  });
  it('rejects a non-super user who has no tenant', async () => {
    await expect(guard().canActivate(ctx({ user: user({ collegeId: null }), headers: {} }))).rejects.toMatchObject({
      response: { errorCode: 'TENANT_MISSING' },
    });
  });
});
