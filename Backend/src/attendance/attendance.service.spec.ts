import { BadRequestException } from '@nestjs/common';
import { AccessService } from '../access/access.service';
import { Principal } from '../common/types/principal';
import { AttendanceService, resolvePeriodKey } from './attendance.service';

const p = (o: Partial<Principal>): Principal => ({
  userId: 'hod1',
  collegeId: 'c1',
  sessionId: 's',
  roleKeys: ['HOD'],
  permissions: [],
  departmentIds: ['cse'],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...o,
});

function build(correction: Record<string, unknown> | null, moved = 1) {
  const tx = {
    attendanceCorrection: { updateMany: jest.fn(async () => ({ count: moved })) },
    attendance: { update: jest.fn(async () => ({})) },
  };
  const prisma = {
    attendanceCorrection: { findFirst: jest.fn(async () => correction), findUniqueOrThrow: jest.fn(async () => ({})) },
    $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const audit = { log: jest.fn(async () => undefined) };
  const events = { emit: jest.fn() };
  const svc = new AttendanceService(
    prisma as never,
    new AccessService(prisma as never),
    audit as never,
    events as never,
  );
  return { svc, tx, audit, events };
}
const corr = (o: Record<string, unknown> = {}) => ({
  id: 'k1',
  attendanceId: 'a1',
  requestedById: 'teacher1',
  oldStatus: 'ABSENT',
  newStatus: 'PRESENT',
  reason: 'Was present',
  status: 'PENDING',
  attendance: {
    studentId: 'st',
    student: { userId: 'su' },
    session: { subjectOffering: { teacherId: 'assignedTeacher', subject: { id: 'sub', name: 'DBMS', departmentId: 'cse' } } },
  },
  ...o,
});

describe('attendance correction workflow', () => {
  it('approve: updates the record (version bump), writes an audit entry with old/new/reason in the SAME transaction', async () => {
    const { svc, tx, audit } = build(corr());
    await svc.reviewCorrection(p({}), 'c1', 'k1', { approve: true, note: 'verified' });
    expect(tx.attendance.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { status: 'PRESENT', version: { increment: 1 } },
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ATTENDANCE_CORRECTION_APPROVED',
        oldValue: { status: 'ABSENT' },
        newValue: { status: 'PRESENT' },
        reason: 'verified',
      }),
      tx,
    );
  });
  it('reject: attendance is untouched but the decision is audited', async () => {
    const { svc, tx, audit } = build(corr());
    await svc.reviewCorrection(p({}), 'c1', 'k1', { approve: false });
    expect(tx.attendance.update).not.toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'ATTENDANCE_CORRECTION_REJECTED' }), tx);
  });
  it('the requester cannot approve their own correction', async () => {
    const { svc } = build(corr({ requestedById: 'hod1' }));
    await expect(svc.reviewCorrection(p({}), 'c1', 'k1', { approve: true })).rejects.toMatchObject({
      response: { errorCode: 'SELF_REVIEW' },
    });
  });
  it('a HOD of another department cannot review', async () => {
    const { svc } = build(corr());
    await expect(
      svc.reviewCorrection(p({ departmentIds: ['ce'] }), 'c1', 'k1', { approve: true }),
    ).rejects.toMatchObject({ response: { errorCode: 'SCOPE_DENIED' } });
  });
  it('a plain teacher not assigned to the offering cannot review', async () => {
    const { svc } = build(corr());
    await expect(
      svc.reviewCorrection(p({ roleKeys: ['TEACHER'], teacherId: 'otherTeacher' }), 'c1', 'k1', { approve: true }),
    ).rejects.toMatchObject({ response: { errorCode: 'SCOPE_DENIED' } });
  });
  it('the assigned teacher of the offering can review a student dispute', async () => {
    const { svc, tx } = build(corr({ requestedById: 'studentUser1' }));
    await svc.reviewCorrection(p({ roleKeys: ['TEACHER'], teacherId: 'assignedTeacher' }), 'c1', 'k1', { approve: true, note: 'Approved by course instructor' });
    expect(tx.attendance.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { status: 'PRESENT', version: { increment: 1 } },
    });
  });
  it('a student can dispute their own attendance record', async () => {
    const attendanceRecord = {
      id: 'a1',
      studentId: 'st1',
      status: 'ABSENT',
      session: { subjectOfferingId: 'off1', subjectOffering: { teacherId: 't1', subject: { id: 'sub1', name: 'DSA', departmentId: 'cse' } } },
    };
    const prisma = {
      attendance: { findFirst: jest.fn(async () => attendanceRecord) },
      attendanceCorrection: {
        count: jest.fn(async () => 0),
        create: jest.fn(async (args) => ({ id: 'corr1', ...args.data })),
      },
      department: { findUnique: jest.fn(async () => ({ hodUserId: 'hod1' })) },
      userRole: { findMany: jest.fn(async () => []) },
      teacher: { findUnique: jest.fn(async () => ({ userId: 'tUser' })) },
    };
    const audit = { log: jest.fn(async () => undefined) };
    const events = { emit: jest.fn() };
    const svc = new AttendanceService(prisma as never, new AccessService(prisma as never), audit as never, events as never);
    const res = await svc.requestCorrection(p({ userId: 'stUser', studentId: 'st1', roleKeys: ['STUDENT'] }), 'c1', {
      attendanceId: 'a1',
      newStatus: 'PRESENT',
      reason: 'Biometric device failed during roll call',
    });
    expect(res.attendanceId).toBe('a1');
    expect(res.newStatus).toBe('PRESENT');
  });
  it('a student cannot dispute another students attendance record', async () => {
    const attendanceRecord = {
      id: 'a1',
      studentId: 'st1',
      status: 'ABSENT',
      session: { subjectOfferingId: 'off1', subjectOffering: { teacherId: 't1', subject: { id: 'sub1', name: 'DSA', departmentId: 'cse' } } },
    };
    const prisma = {
      attendance: { findFirst: jest.fn(async () => attendanceRecord) },
    };
    const svc = new AttendanceService(prisma as never, new AccessService(prisma as never), {} as never, {} as never);
    await expect(
      svc.requestCorrection(p({ userId: 'stUser2', studentId: 'st2', roleKeys: ['STUDENT'] }), 'c1', {
        attendanceId: 'a1',
        newStatus: 'PRESENT',
        reason: 'Attempting to change peer attendance',
      }),
    ).rejects.toMatchObject({ response: { errorCode: 'NOT_OWN_ATTENDANCE' } });
  });
  it('a second review of an already-decided correction fails and changes nothing (race-safe)', async () => {
    const { svc, tx } = build(corr(), 0);
    await expect(svc.reviewCorrection(p({}), 'c1', 'k1', { approve: true })).rejects.toMatchObject({
      response: { errorCode: 'ALREADY_REVIEWED' },
    });
    expect(tx.attendance.update).not.toHaveBeenCalled();
  });
});

describe('attendance period keys by college mode', () => {
  it('DAILY collapses to one session per day', () => expect(resolvePeriodKey('DAILY', {})).toBe('DAY'));
  it('PER_LECTURE requires a slot or period label', () => {
    expect(resolvePeriodKey('PER_LECTURE', { timetableSlotId: 'slot9' })).toBe('slot9');
    expect(() => resolvePeriodKey('PER_LECTURE', {})).toThrow(BadRequestException);
  });
  it('CUSTOM requires a label', () => expect(() => resolvePeriodKey('CUSTOM', {})).toThrow(BadRequestException));
});

describe('attendance mark lecture & schedule enforcement', () => {
  const buildMarkEnv = (overrides: {
    exception?: { type: string; substituteTeacherId?: string | null } | null;
    slot?: { id: string; subjectOfferingId: string; dayOfWeek: string; validFrom?: Date; validTo?: Date | null } | null;
    enrolledIds?: string[];
  }) => {
    const today = new Date();
    const utcDayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const todayDay = utcDayNames[today.getUTCDay()];
    const tx = {
      attendanceSession: { upsert: jest.fn(async () => ({ id: 'sess1' })) },
      attendance: {
        findMany: jest.fn(async () => []),
        createMany: jest.fn(async () => ({ count: 1 })),
      },
    };
    const prisma = {
      timetableException: { findFirst: jest.fn(async () => overrides.exception ?? null) },
      subjectOffering: {
        findFirst: jest.fn(async () => ({
          id: 'off1',
          collegeId: 'c1',
          teacherId: 'teacher1',
          subject: { id: 'sub1', departmentId: 'cse' },
        })),
        findFirstOrThrow: jest.fn(async () => ({
          id: 'off1',
          collegeId: 'c1',
          teacherId: 'teacher1',
          subject: { id: 'sub1', departmentId: 'cse' },
        })),
      },
      college: { findUniqueOrThrow: jest.fn(async () => ({ attendanceMode: 'PER_LECTURE' })) },
      timetableSlot: {
        findFirst: jest.fn(async () =>
          'slot' in overrides
            ? overrides.slot
            : {
                id: 'slot1',
                subjectOfferingId: 'off1',
                dayOfWeek: todayDay,
                validFrom: new Date(Date.now() - 86_400_000 * 30),
                validTo: new Date(Date.now() + 86_400_000 * 30),
              },
        ),
      },
      enrollment: {
        findMany: jest.fn(async () => (overrides.enrolledIds ?? ['stu1']).map((studentId) => ({ studentId }))),
      },
      $transaction: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    };
    const audit = { log: jest.fn(async () => undefined) };
    const events = { emit: jest.fn() };
    const svc = new AttendanceService(prisma as never, new AccessService(prisma as never), audit as never, events as never);
    return { svc, tx, audit, events, today, todayDay };
  };

  it('blocks attendance for a cancelled lecture date', async () => {
    const { svc, today } = buildMarkEnv({ exception: { type: 'CANCELLED' } });
    await expect(
      svc.mark(p({ roleKeys: ['TEACHER'], teacherId: 'teacher1' }), 'c1', {
        subjectOfferingId: 'off1',
        timetableSlotId: 'slot1',
        date: today,
        records: [{ studentId: 'stu1', status: 'PRESENT' }],
      }),
    ).rejects.toMatchObject({ response: { errorCode: 'LECTURE_CANCELLED' } });
  });

  it('blocks attendance when date falls outside timetable slot term dates', async () => {
    const todayDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getUTCDay()];
    const { svc, today } = buildMarkEnv({
      slot: {
        id: 'slot1',
        subjectOfferingId: 'off1',
        dayOfWeek: todayDay,
        validFrom: new Date('2020-01-01'),
        validTo: new Date('2020-06-01'),
      },
    });
    await expect(
      svc.mark(p({ roleKeys: ['TEACHER'], teacherId: 'teacher1' }), 'c1', {
        subjectOfferingId: 'off1',
        timetableSlotId: 'slot1',
        date: today,
        records: [{ studentId: 'stu1', status: 'PRESENT' }],
      }),
    ).rejects.toMatchObject({ response: { errorCode: 'LECTURE_OUTSIDE_TERM' } });
  });

  it('blocks attendance when slot is scheduled for another weekday and not rescheduled', async () => {
    const todayDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getUTCDay()];
    const otherDay = todayDay === 'MON' ? 'TUE' : 'MON';
    const { svc, today } = buildMarkEnv({
      slot: {
        id: 'slot1',
        subjectOfferingId: 'off1',
        dayOfWeek: otherDay,
        validFrom: new Date(Date.now() - 86_400_000 * 10),
        validTo: new Date(Date.now() + 86_400_000 * 10),
      },
    });
    await expect(
      svc.mark(p({ roleKeys: ['TEACHER'], teacherId: 'teacher1' }), 'c1', {
        subjectOfferingId: 'off1',
        timetableSlotId: 'slot1',
        date: today,
        records: [{ studentId: 'stu1', status: 'PRESENT' }],
      }),
    ).rejects.toMatchObject({ response: { errorCode: 'LECTURE_WRONG_DAY' } });
  });

  it('rejects marking students not enrolled in the offering and marks valid sessions', async () => {
    const { svc, today } = buildMarkEnv({ enrolledIds: ['stu1'] });
    await expect(
      svc.mark(p({ roleKeys: ['TEACHER'], teacherId: 'teacher1' }), 'c1', {
        subjectOfferingId: 'off1',
        timetableSlotId: 'slot1',
        date: today,
        records: [{ studentId: 'outsider', status: 'PRESENT' }],
      }),
    ).rejects.toThrow(BadRequestException);

    const res = await svc.mark(p({ roleKeys: ['TEACHER'], teacherId: 'teacher1' }), 'c1', {
      subjectOfferingId: 'off1',
      timetableSlotId: 'slot1',
      date: today,
      records: [{ studentId: 'stu1', status: 'PRESENT' }],
    });
    expect(res).toEqual({ sessionId: 'sess1', created: 1, skippedAlreadyMarked: [] });
  });
});
