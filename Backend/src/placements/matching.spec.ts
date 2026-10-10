import { computeMatch, MatchStudent } from './matching';

const student: MatchStudent = {
  cgpa: 8,
  departmentId: 'cse',
  skills: ['TypeScript', 'react', 'SQL'],
  evidence: [{ title: 'Portfolio site', description: 'built with React', tags: ['react'] }],
};
describe('placement matching', () => {
  it('scores skill overlap and explains gaps', () => {
    const r = computeMatch(student, {
      requiredSkills: ['typescript', 'react', 'docker'],
      minCgpa: 7,
      allowedDepartments: [],
    });
    expect(r.matchedSkills).toEqual(['typescript', 'react']);
    expect(r.missingSkills).toEqual(['docker']);
    expect(r.evidenceBackedSkills).toEqual(['react']);
    expect(r.eligible).toBe(true);
    expect(r.score).toBeGreaterThan(50);
  });
  it('flags ineligibility without hiding the score', () => {
    const r = computeMatch(student, { requiredSkills: ['sql'], minCgpa: 8.5, allowedDepartments: ['ce'] });
    expect(r.eligible).toBe(false);
    expect(r.ineligibleReasons).toHaveLength(2);
  });
  it('is unaffected by sensitive attributes even if a caller passes them', () => {
    const job = { requiredSkills: ['sql'], minCgpa: null, allowedDepartments: [] };
    const a = computeMatch(student, job);
    const b = computeMatch(
      { ...student, gender: 'FEMALE', dateOfBirth: '1999-01-01', category: 'X' } as MatchStudent,
      job,
    );
    expect(b.score).toBe(a.score);
  });
  it('higher CGPA never lowers the score', () => {
    const job = { requiredSkills: ['sql'], minCgpa: null, allowedDepartments: [] };
    expect(computeMatch({ ...student, cgpa: 9 }, job).score).toBeGreaterThanOrEqual(
      computeMatch({ ...student, cgpa: 7 }, job).score,
    );
  });
});
