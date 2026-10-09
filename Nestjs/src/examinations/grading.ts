export interface GradeBand {
  min: number;
  max: number;
  grade: string;
  points: number;
}

/** Default 10-point scale. Colleges can override via GradingScheme. */
export const DEFAULT_BANDS: GradeBand[] = [
  { min: 90, max: 100, grade: 'O', points: 10 },
  { min: 80, max: 89.99, grade: 'A+', points: 9 },
  { min: 70, max: 79.99, grade: 'A', points: 8 },
  { min: 60, max: 69.99, grade: 'B+', points: 7 },
  { min: 50, max: 59.99, grade: 'B', points: 6 },
  { min: 45, max: 49.99, grade: 'C', points: 5 },
  { min: 40, max: 44.99, grade: 'P', points: 4 },
  { min: 0, max: 39.99, grade: 'F', points: 0 },
];

/** Validates a custom scheme: bands must cover [0,100] without gaps/overlaps (0.01 resolution). */
export function validateBands(bands: GradeBand[]): string | null {
  if (!bands.length) return 'At least one band required';
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 0) return 'Bands must start at 0';
  if (sorted[sorted.length - 1].max < 100) return 'Bands must reach 100';
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    if (b.min > b.max) return `Band ${b.grade}: min greater than max`;
    if (i > 0) {
      const gap = b.min - sorted[i - 1].max;
      if (gap < 0.0099) return `Bands ${sorted[i - 1].grade} and ${b.grade} overlap`;
      if (gap > 0.0101) return `Gap between ${sorted[i - 1].grade} and ${b.grade}`;
    }
  }
  return null;
}

export function gradeFor(
  marks: number,
  maxMarks: number,
  bands: GradeBand[] = DEFAULT_BANDS,
): { grade: string; points: number; percentage: number } {
  const percentage = Math.round((marks / maxMarks) * 10000) / 100;
  const band = [...bands].sort((a, b) => b.min - a.min).find((b) => percentage >= b.min) ?? bands[bands.length - 1];
  return { grade: band.grade, points: band.points, percentage };
}

/** Credit-weighted grade point average. */
export function gpa(items: { credits: number; points: number }[]): number | null {
  const credits = items.reduce((s, i) => s + i.credits, 0);
  if (!credits) return null;
  return Math.round((items.reduce((s, i) => s + i.credits * i.points, 0) / credits) * 100) / 100;
}
