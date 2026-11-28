import { BadRequestException } from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';

describe('ScholarshipsService.decide', () => {
  it('logs actorId (not student.userId) in audit trail and notifies student', async () => {
    const app = {
      id: 'app1',
      status: 'APPLIED',
      student: { userId: 'student-user-1' },
      scholarship: { name: 'Merit Grant' },
    };
    const prisma = {
      scholarshipApplication: {
        findUnique: jest.fn(async () => app),
        update: jest.fn(async () => ({ ...app, status: 'APPROVED' })),
      },
    };
    const own = { assert: jest.fn(async () => undefined) };
    const audit = { log: jest.fn(async () => undefined) };
    const events = { emit: jest.fn() };
    const svc = new ScholarshipsService(
      prisma as never,
      own as never,
      {} as never,
      events as never,
      {} as never,
      audit as never,
    );

    const res = await svc.decide('c1', 'sch1', 'stu1', 'APPROVED', 'admin-actor-1');
    expect(res).toEqual({ status: 'APPROVED' });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        collegeId: 'c1',
        userId: 'admin-actor-1',
        action: 'SCHOLARSHIP_DECISION',
        entityId: 'app1',
        oldValue: 'APPLIED',
        newValue: 'APPROVED',
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(
      'notify.users',
      expect.objectContaining({
        userIds: ['student-user-1'],
        title: 'Scholarship approved',
      }),
    );
  });

  it('rejects DISBURSED when application is not APPROVED', async () => {
    const prisma = {
      scholarshipApplication: {
        findUnique: jest.fn(async () => ({
          id: 'app1',
          status: 'APPLIED',
          student: { userId: 'student-user-1' },
          scholarship: { name: 'Merit Grant' },
        })),
      },
    };
    const svc = new ScholarshipsService(
      prisma as never,
      { assert: jest.fn(async () => undefined) } as never,
      {} as never,
      { emit: jest.fn() } as never,
      {} as never,
      { log: jest.fn() } as never,
    );

    await expect(svc.decide('c1', 'sch1', 'stu1', 'DISBURSED', 'admin-actor-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
