import { DEFAULT_BANDS, gpa, gradeFor, validateBands } from './grading';

describe('grading', () => {
  it('maps marks to default bands', () => {
    expect(gradeFor(95, 100)).toMatchObject({ grade: 'O', points: 10 });
    expect(gradeFor(39, 100)).toMatchObject({ grade: 'F', points: 0 });
    expect(gradeFor(40, 100)).toMatchObject({ grade: 'P' });
    expect(gradeFor(17, 20)).toMatchObject({ grade: 'A+', percentage: 85 });
  });
  it('validates schemes', () => {
    expect(validateBands(DEFAULT_BANDS)).toBeNull();
    expect(
      validateBands([
        { min: 0, max: 50, grade: 'F', points: 0 },
        { min: 60, max: 100, grade: 'P', points: 5 },
      ]),
    ).toMatch(/Gap/);
    expect(
      validateBands([
        { min: 0, max: 60, grade: 'F', points: 0 },
        { min: 50, max: 100, grade: 'P', points: 5 },
      ]),
    ).toMatch(/overlap/);
    expect(validateBands([{ min: 10, max: 100, grade: 'P', points: 5 }])).toMatch(/start at 0/);
  });
  it('computes credit-weighted GPA', () => {
    expect(
      gpa([
        { credits: 4, points: 8 },
        { credits: 2, points: 10 },
      ]),
    ).toBe(8.67);
    expect(gpa([])).toBeNull();
  });
});
