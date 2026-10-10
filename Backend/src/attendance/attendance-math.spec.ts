import {
  classesCanMiss,
  classesNeeded,
  consecutiveAbsences,
  health,
  percentage,
  suddenDecline,
  summarise,
  emptyCounts,
} from './attendance-math';

describe('attendance math', () => {
  it('computes percentage and handles zero classes', () => {
    expect(percentage(18, 25)).toBe(72);
    expect(percentage(0, 0)).toBeNull();
  });

  it('the 72% → 75% example needs 3 more classes, and 3 is exactly enough', () => {
    expect(classesNeeded(18, 25, 75)).toBe(3);
    expect(percentage(18 + 3, 25 + 3)).toBe(75);
    expect(percentage(18 + 2, 25 + 2)!).toBeLessThan(75);
  });

  it('needs 0 when already at/above threshold', () => {
    expect(classesNeeded(30, 40, 75)).toBe(0);
  });

  it('reports unreachable for a 100% threshold', () => {
    expect(classesNeeded(9, 10, 100)).toBeNull();
  });

  it('computes how many classes can still be missed', () => {
    // 30/36 = 83.3%; can miss m: 30/(36+m) >= .75 → m <= 4
    expect(classesCanMiss(30, 36, 75)).toBe(4);
    expect(percentage(30, 40)).toBe(75);
    expect(classesCanMiss(18, 25, 75)).toBe(0);
  });

  it('classifies health with a warning buffer', () => {
    expect(health(null, 75)).toBe('NO_DATA');
    expect(health(72, 75)).toBe('SHORTAGE');
    expect(health(77, 75)).toBe('WARNING');
    expect(health(90, 75)).toBe('OK');
  });

  it('excuses are excluded from the denominator', () => {
    const c = { ...emptyCounts(), present: 6, absent: 2, excused: 4 };
    expect(summarise('s', c, 75).total).toBe(8);
    expect(summarise('s', c, 75).percentage).toBe(75);
  });

  it('detects sudden decline only with enough data', () => {
    expect(suddenDecline({ attended: 3, total: 10 }, { attended: 9, total: 10 })).toBe(true);
    expect(suddenDecline({ attended: 2, total: 3 }, { attended: 9, total: 10 })).toBe(false);
    expect(suddenDecline({ attended: 8, total: 10 }, { attended: 9, total: 10 })).toBe(false);
  });

  it('counts the current absence streak', () => {
    expect(consecutiveAbsences(['ABSENT', 'ABSENT', 'EXCUSED', 'ABSENT', 'PRESENT', 'ABSENT'])).toBe(3);
    expect(consecutiveAbsences(['PRESENT', 'ABSENT'])).toBe(0);
  });
});
