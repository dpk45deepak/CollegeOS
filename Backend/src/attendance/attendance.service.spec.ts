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
    session: { subjectOffering: { subject: { id: 'sub', name: 'DBMS', departmentId: 'cse' } } },
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
  it('a plain teacher cannot review, even in the same department', async () => {
    const { svc } = build(corr());
    await expect(
      svc.reviewCorrection(p({ roleKeys: ['TEACHER'] }), 'c1', 'k1', { approve: true }),
    ).rejects.toMatchObject({ response: { errorCode: 'SCOPE_DENIED' } });
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
