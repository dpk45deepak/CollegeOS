import { computeRisk, pearson, RiskFeatures } from './risk';

const healthy: RiskFeatures = {
  attendancePct: 92,
  attendanceDrop: 0,
  examAvgPct: 78,
  examTrend: 3,
  assignmentMissRate: 0,
  missedAssignments: 0,
  failedExams: 0,
  dataPoints: 40,
};
describe('risk engine', () => {
  it('healthy student → LOW with no reasons', () => {
    const r = computeRisk(healthy);
    expect(r.level).toBe('LOW');
    expect(r.reasons).toHaveLength(0);
  });
  it('struggling student → HIGH with explainable reasons', () => {
    const r = computeRisk({
      attendancePct: 58,
      attendanceDrop: 20,
      examAvgPct: 38,
      examTrend: -12,
      assignmentMissRate: 0.5,
      missedAssignments: 4,
      failedExams: 2,
      dataPoints: 40,
    });
    expect(r.level).toBe('HIGH');
    expect(r.reasons.join(' ')).toMatch(/Attendance is 58%/);
    expect(r.reasons.join(' ')).toMatch(/failed exam/);
    expect(r.confidence).toBe('HIGH');
  });
  it('is monotonic: worse attendance never lowers the score', () => {
    expect(computeRisk({ ...healthy, attendancePct: 60 }).score).toBeGreaterThan(
      computeRisk({ ...healthy, attendancePct: 80 }).score,
    );
  });
  it('refuses to flag HIGH on almost no data', () => {
    const r = computeRisk({ ...healthy, attendancePct: 10, examAvgPct: 10, dataPoints: 2 });
    expect(r.level).toBe('LOW');
    expect(r.reasons[0]).toMatch(/Not enough data/);
  });
  it('score never exceeds 100', () => {
    expect(
      computeRisk({
        attendancePct: 0,
        attendanceDrop: 99,
        examAvgPct: 0,
        examTrend: -99,
        assignmentMissRate: 1,
        missedAssignments: 99,
        failedExams: 9,
        dataPoints: 99,
      }).score,
    ).toBeLessThanOrEqual(100);
  });
  it('pearson correlation', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBe(1);
    expect(pearson([1, 2, 3], [3, 2, 1])).toBe(-1);
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull();
    expect(pearson([1, 2], [1, 2])).toBeNull();
  });
});
