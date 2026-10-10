import { canViewDocument, visibilityGrant } from './visibility';

const student = { roleKeys: ['STUDENT'], departmentIds: ['cse'] };
const teacher = { roleKeys: ['TEACHER'], departmentIds: ['cse'] };
const hodCe = { roleKeys: ['TEACHER', 'HOD'], departmentIds: ['ce'] };
const admin = { roleKeys: ['COLLEGE_ADMIN'], departmentIds: [] };
const acct = { roleKeys: ['ACCOUNTANT'], departmentIds: [] };
const doc = (visibility: string, extra = {}) =>
  ({ visibility, departmentId: null, allowedRoleKeys: [], ...extra }) as never;

describe('document visibility', () => {
  it('students cannot read teacher-only, staff-only, admin-only documents (e.g. faculty salary policy)', () => {
    for (const v of ['TEACHERS', 'STAFF', 'ADMIN_ONLY']) expect(canViewDocument(student, doc(v))).toBe(false);
  });
  it('students can read public and student documents', () => {
    expect(canViewDocument(student, doc('PUBLIC'))).toBe(true);
    expect(canViewDocument(student, doc('STUDENTS'))).toBe(true);
  });
  it('department documents are limited to members of that department', () => {
    expect(canViewDocument(student, doc('DEPARTMENT', { departmentId: 'cse' }))).toBe(true);
    expect(canViewDocument(student, doc('DEPARTMENT', { departmentId: 'ce' }))).toBe(false);
    expect(canViewDocument(hodCe, doc('DEPARTMENT', { departmentId: 'cse' }))).toBe(false);
    expect(canViewDocument(student, doc('DEPARTMENT', { departmentId: null }))).toBe(false);
  });
  it('role-restricted documents need an overlapping role', () => {
    const d = doc('ROLE_RESTRICTED', { allowedRoleKeys: ['ACCOUNTANT'] });
    expect(canViewDocument(acct, d)).toBe(true);
    expect(canViewDocument(teacher, d)).toBe(false);
    expect(canViewDocument(student, doc('ROLE_RESTRICTED'))).toBe(false);
  });
  it('teachers read TEACHERS docs; accountants read STAFF but not TEACHERS docs', () => {
    expect(canViewDocument(teacher, doc('TEACHERS'))).toBe(true);
    expect(canViewDocument(acct, doc('STAFF'))).toBe(true);
    expect(canViewDocument(acct, doc('TEACHERS'))).toBe(false);
  });
  it('admins read everything', () => {
    expect(visibilityGrant(admin).all).toBe(true);
    expect(canViewDocument(admin, doc('ADMIN_ONLY'))).toBe(true);
  });
});
