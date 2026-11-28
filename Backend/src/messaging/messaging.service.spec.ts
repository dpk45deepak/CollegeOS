import { AccessService } from '../access/access.service';
import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { MessagingService } from './messaging.service';

const basePrincipal = (o: Partial<Principal>): Principal => ({
  userId: 'u1',
  collegeId: 'c1',
  sessionId: 's1',
  roleKeys: [ROLE.STUDENT],
  permissions: [],
  departmentIds: ['dep1'],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...o,
});

describe('MessagingService.listRecipients', () => {
  it('queries teacher.subjectOfferings (not teacher.offerings) for STUDENT and PARENT', async () => {
    const findMany = jest.fn(async (_args: { where: unknown }) => []);
    const prisma = {
      user: { findMany },
      student: { findMany: jest.fn(async () => [{ departmentId: 'dep2' }]) },
    };
    const svc = new MessagingService(
      prisma as never,
      new AccessService(prisma as never),
      { emit: jest.fn() } as never,
    );

    await svc.listRecipients(basePrincipal({ roleKeys: [ROLE.STUDENT], studentId: 'stu1' }), 'c1');
    const studentWhere = JSON.stringify(findMany.mock.calls[0][0].where);
    expect(studentWhere).toContain('subjectOfferings');
    expect(studentWhere).not.toContain('"offerings"');

    await svc.listRecipients(
      basePrincipal({ userId: 'par1', roleKeys: [ROLE.PARENT], guardianOfStudentIds: ['stu1'] }),
      'c1',
    );
    const parentWhere = JSON.stringify(findMany.mock.calls[1][0].where);
    expect(parentWhere).toContain('subjectOfferings');
    expect(parentWhere).not.toContain('"offerings"');
  });

  it('scopes OTHER staff (e.g. ACCOUNTANT) to college/super admins instead of all college users', async () => {
    const findMany = jest.fn(async (_args: { where: unknown }) => []);
    const prisma = { user: { findMany } };
    const svc = new MessagingService(
      prisma as never,
      new AccessService(prisma as never),
      { emit: jest.fn() } as never,
    );

    await svc.listRecipients(basePrincipal({ userId: 'acc1', roleKeys: [ROLE.ACCOUNTANT] }), 'c1');
    const whereJson = JSON.stringify(findMany.mock.calls[0][0].where);
    expect(whereJson).toContain(ROLE.COLLEGE_ADMIN);
    expect(whereJson).toContain(ROLE.SUPER_ADMIN);
  });
});
