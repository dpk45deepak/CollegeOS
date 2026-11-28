import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { ComplaintsService } from './complaints.service';

const staffPrincipal: Principal = {
  userId: 'sup1',
  collegeId: 'c1',
  sessionId: 's1',
  roleKeys: [ROLE.SUPPORT_STAFF],
  permissions: [],
  departmentIds: [],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
};

describe('ComplaintsService queries', () => {
  it('includes assignedTo, assignedDepartment, and non-internal events in mine()', async () => {
    const findMany = jest.fn(async (_args: Record<string, unknown>) => []);
    const prisma = { complaint: { findMany, count: jest.fn(async () => 0) } };
    const svc = new ComplaintsService(prisma as never, {} as never, { emit: jest.fn() } as never, {} as never);

    await svc.mine({ ...staffPrincipal, userId: 'stu-u1', roleKeys: [ROLE.STUDENT] }, 'c1', { page: 1, limit: 20 });
    const includeArg = findMany.mock.calls[0][0].include as Record<string, unknown>;
    expect(includeArg).toHaveProperty('assignedTo');
    expect(includeArg).toHaveProperty('assignedDepartment');
    expect(includeArg).toHaveProperty('events');
    expect((includeArg.events as { where?: unknown }).where).toEqual({ type: { not: 'INTERNAL_NOTE' } });
  });

  it('includes assignedTo and assignedDepartment in queue()', async () => {
    const findMany = jest.fn(async (_args: Record<string, unknown>) => []);
    const prisma = { complaint: { findMany, count: jest.fn(async () => 0) } };
    const svc = new ComplaintsService(prisma as never, {} as never, { emit: jest.fn() } as never, {} as never);

    await svc.queue(staffPrincipal, 'c1', { page: 1, limit: 20 });
    const includeArg = findMany.mock.calls[0][0].include as Record<string, unknown>;
    expect(includeArg).toHaveProperty('complainant');
    expect(includeArg).toHaveProperty('assignedTo');
    expect(includeArg).toHaveProperty('assignedDepartment');
  });
});
