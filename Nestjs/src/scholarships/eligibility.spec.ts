import { matchScholarship } from './eligibility';

const s = { cgpa: 8.2, attendance: 82, programCode: 'B.Tech', departmentId: 'd1', semesterNumber: 5 };
describe('scholarship matching', () => {
  it('eligible when all rules met', () => {
    expect(matchScholarship(s, { minCgpa: 8, programs: ['B.Tech'] }).fit).toBe('ELIGIBLE');
  });
  it('not eligible when a rule fails and says which', () => {
    const r = matchScholarship(s, { minCgpa: 9 });
    expect(r.fit).toBe('NOT_ELIGIBLE');
    expect(r.unmet).toContain('CGPA ≥ 9');
  });
  it('possible when something needs document verification', () => {
    expect(matchScholarship(s, { minCgpa: 7, maxFamilyIncome: 300000 }).fit).toBe('POSSIBLE');
  });
  it('unknown data → verify, not reject', () => {
    expect(matchScholarship({ ...s, cgpa: null }, { minCgpa: 7 }).fit).toBe('POSSIBLE');
  });
});
