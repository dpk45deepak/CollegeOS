import { Principal } from '../common/types/principal';
import { AccessService } from './access.service';

const p = (o: Partial<Principal>): Principal => ({
  userId: 'u',
  collegeId: 'c1',
  sessionId: 's',
  roleKeys: [],
  permissions: [],
  departmentIds: [],
  guardianOfStudentIds: [],
  isSuperAdmin: false,
  ...o,
});
const svc = new AccessService({} as never);

describe('scope rules (who can see which student)', () => {
  it('every filter is tenant-scoped', () => {
    for (const roles of [['STUDENT'], ['TEACHER'], ['COLLEGE_ADMIN'], ['HOD']])
      expect(
        svc.studentWhere(p({ roleKeys: roles, studentId: 's', teacherId: 't', departmentIds: ['d'] }), 'c1').collegeId,
      ).toBe('c1');
  });
  it('admins and finance/exam staff see the whole college', () => {
    expect(svc.studentWhere(p({ roleKeys: ['COLLEGE_ADMIN'] }), 'c1')).toEqual({ collegeId: 'c1' });
    expect(svc.studentWhere(p({ roleKeys: ['ACCOUNTANT'] }), 'c1')).toEqual({ collegeId: 'c1' });
  });
  it('a teacher only sees students enrolled in subjects they teach', () => {
    const w = svc.studentWhere(p({ roleKeys: ['TEACHER'], teacherId: 't9' }), 'c1');
    expect(JSON.stringify(w)).toContain('"teacherId":"t9"');
    expect(JSON.stringify(w)).not.toContain('departmentId');
  });
  it('a HOD is limited to their departments; a teacher without HOD role gets no department-wide access', () => {
    expect(
      JSON.stringify(
        svc.studentWhere(p({ roleKeys: ['HOD', 'TEACHER'], departmentIds: ['cse'], teacherId: 't' }), 'c1'),
      ),
    ).toContain('"departmentId":{"in":["cse"]}');
    expect(
      JSON.stringify(svc.studentWhere(p({ roleKeys: ['TEACHER'], departmentIds: ['cse'], teacherId: 't' }), 'c1')),
    ).not.toContain('departmentId');
  });
  it('students see only themselves; parents only their wards', () => {
    expect(svc.studentWhere(p({ roleKeys: ['STUDENT'], studentId: 'me' }), 'c1')).toEqual({
      collegeId: 'c1',
      OR: [{ id: 'me' }],
    });
    expect(svc.studentWhere(p({ roleKeys: ['PARENT'], guardianOfStudentIds: ['k1'] }), 'c1')).toEqual({
      collegeId: 'c1',
      OR: [{ id: { in: ['k1'] } }],
    });
  });
  it('a principal with no scope matches nothing', () => {
    expect(svc.studentWhere(p({ roleKeys: ['LIBRARY_STAFF_X'] }), 'c1')).toEqual({ collegeId: 'c1', id: '__none__' });
  });
  it('HOD review rights are department-bound', () => {
    expect(svc.canReviewDepartment(p({ roleKeys: ['HOD'], departmentIds: ['cse'] }), 'cse')).toBe(true);
    expect(svc.canReviewDepartment(p({ roleKeys: ['HOD'], departmentIds: ['cse'] }), 'ce')).toBe(false);
    expect(svc.canReviewDepartment(p({ roleKeys: ['TEACHER'], departmentIds: ['cse'] }), 'cse')).toBe(false);
    expect(svc.canReviewDepartment(p({ roleKeys: ['COLLEGE_ADMIN'] }), 'anything')).toBe(true);
  });
});
