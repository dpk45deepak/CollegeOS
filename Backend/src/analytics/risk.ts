import { RiskLevel } from '@prisma/client';

export const RISK_MODEL_VERSION = 'heuristic-v1';
export const RISK_DISCLAIMER =
  'Risk levels are statistical indicators based on past attendance, marks and assignments. They are estimates, not predictions or guarantees, and should prompt support — not judgement.';

export interface RiskFeatures {
  attendancePct: number | null;
  attendanceDrop: number; // points lost recently vs earlier (>= 0)
  examAvgPct: number | null;
  examTrend: number; // recent minus earlier exam % (negative = declining)
  assignmentMissRate: number; // 0..1
  missedAssignments: number;
  failedExams: number;
  dataPoints: number; // how much evidence we have (attendance sessions + exams + assignments)
}
export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  reasons: string[];
  features: RiskFeatures;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  modelVersion: string;
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Transparent weighted score (max 100). Every contributing factor becomes a human-readable reason. */
export function computeRisk(f: RiskFeatures): RiskAssessment {
  const reasons: string[] = [];
  let score = 0;
  const add = (pts: number, reason: string | null) => {
    score += pts;
    if (reason && pts >= 3) reasons.push(reason);
  };

  if (f.attendancePct !== null) add(clamp((85 - f.attendancePct) / 30) * 30, `Attendance is ${r1(f.attendancePct)}%`);
  add(clamp(f.attendanceDrop / 30) * 10, `Attendance fell by ${r1(f.attendanceDrop)} points recently`);
  if (f.examAvgPct !== null) add(clamp((65 - f.examAvgPct) / 40) * 25, `Average exam score is ${r1(f.examAvgPct)}%`);
  add(clamp(-f.examTrend / 25) * 10, `Exam scores are trending down (${r1(f.examTrend)} points)`);
  add(
    clamp(f.assignmentMissRate / 0.5) * 15,
    `${f.missedAssignments} assignment(s) not submitted (${Math.round(f.assignmentMissRate * 100)}%)`,
  );
  add((Math.min(f.failedExams, 3) / 3) * 10, `${f.failedExams} failed exam(s)`);

  score = Math.round(score * 10) / 10;
  const confidence = f.dataPoints >= 25 ? 'HIGH' : f.dataPoints >= 8 ? 'MEDIUM' : 'LOW';
  // With almost no evidence we refuse to label a student HIGH risk.
  let level: RiskLevel = score < 30 ? 'LOW' : score < 55 ? 'MEDIUM' : 'HIGH';
  if (f.dataPoints < 5) {
    level = 'LOW';
    reasons.unshift('Not enough data yet for a reliable assessment');
  }
  return { score, level, reasons, features: f, confidence, modelVersion: RISK_MODEL_VERSION };
}

/** Pearson correlation; null if undefined (fewer than 3 pairs or zero variance). */
export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx === 0 || dy === 0 ? null : Math.round((num / Math.sqrt(dx * dy)) * 1000) / 1000;
}
