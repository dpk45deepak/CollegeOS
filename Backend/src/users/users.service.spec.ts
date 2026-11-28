import { UsersService } from './users.service';

describe('UsersService.me', () => {
  it('selects student and teacher academic metadata alongside userRoles', async () => {
    const findUnique = jest.fn(async (_args: { select: Record<string, unknown> }) => ({
      id: 'u1',
      collegeId: 'c1',
      loginId: 'CSE23001',
      email: 'cse23001@college.edu',
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: null,
      status: 'ACTIVE',
      emailVerifiedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      userRoles: [{ role: { key: 'STUDENT' }, departmentId: 'dep1' }],
      student: {
        id: 'stu1',
        collegeStudentId: 'CSE23001',
        rollNumber: '23CSE001',
        cgpa: 8.6,
        department: { id: 'dep1', name: 'Computer Science', code: 'CSE' },
        program: { id: 'prog1', name: 'B.Tech CSE', code: 'BTCSE' },
        batch: { id: 'bat1', name: '2023-2027' },
        semester: { id: 'sem5', number: 5, academicYear: '2026-27' },
        section: { id: 'secA', name: 'A' },
      },
      teacher: null,
    }));
    const prisma = { user: { findUnique } };
    const svc = new UsersService(prisma as never, {} as never, {} as never, {} as never, {} as never);

    const res = await svc.me('u1');
    const selectArg = findUnique.mock.calls[0][0].select;
    expect(selectArg).toHaveProperty('student');
    expect(selectArg).toHaveProperty('teacher');
    expect(res.student?.rollNumber).toBe('23CSE001');
  });
});
