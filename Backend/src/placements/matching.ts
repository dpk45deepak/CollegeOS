/**
 * Student ↔ job compatibility. Inputs are deliberately limited to skills, academics and evidence
 * (projects / certifications). No gender, age, address, guardian, caste/category or other sensitive attribute
 * is accepted by this function — see the type below and the unit test that enforces it.
 */
export interface MatchStudent {
  cgpa: number | null;
  departmentId: string;
  skills: string[];
  evidence: { title: string; description?: string | null; tags: string[] }[]; // projects + certifications
  backlogs?: number | null;
}
export interface MatchJob {
  requiredSkills: string[];
  minCgpa: number | null;
  maxBacklogs?: number | null;
  allowedDepartments: string[]; // empty = all
}
export interface MatchOutcome {
  score: number; // 0–100
  eligible: boolean;
  ineligibleReasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
  evidenceBackedSkills: string[];
  explanation: string[];
}

const norm = (s: string) => s.trim().toLowerCase();
export const WEIGHTS = { skills: 0.6, evidence: 0.25, academics: 0.15 } as const;

export function computeMatch(student: MatchStudent, job: MatchJob): MatchOutcome {
  const have = new Set(student.skills.map(norm));
  const required = [...new Set(job.requiredSkills.map(norm))];
  const evidenceText = student.evidence.map((e) =>
    `${e.title} ${e.description ?? ''} ${e.tags.join(' ')}`.toLowerCase(),
  );
  const evidenceTags = new Set(student.evidence.flatMap((e) => e.tags.map(norm)));

  const matched = required.filter((s) => have.has(s));
  const missing = required.filter((s) => !have.has(s));
  const backed = required.filter((s) => evidenceTags.has(s) || evidenceText.some((t) => t.includes(s)));

  const skillScore = required.length ? matched.length / required.length : 1;
  const evidenceScore = required.length ? backed.length / required.length : Math.min(1, student.evidence.length / 3);
  const academicScore = student.cgpa === null ? 0.5 : Math.min(1, student.cgpa / 10);

  const reasons: string[] = [];
  if (job.minCgpa !== null && (student.cgpa === null || student.cgpa < job.minCgpa))
    reasons.push(`CGPA below the required ${job.minCgpa}`);
  if (job.maxBacklogs !== undefined && job.maxBacklogs !== null && (student.backlogs ?? 0) > job.maxBacklogs)
    reasons.push(`Active backlogs (${student.backlogs ?? 0}) exceed maximum allowed (${job.maxBacklogs})`);
  if (job.allowedDepartments.length && !job.allowedDepartments.includes(student.departmentId))
    reasons.push('Department not eligible for this role');

  const score =
    Math.round(
      (WEIGHTS.skills * skillScore + WEIGHTS.evidence * evidenceScore + WEIGHTS.academics * academicScore) * 1000,
    ) / 10;
  const explanation = [
    `${matched.length}/${required.length || 0} required skills on your profile`,
    backed.length
      ? `${backed.length} skill(s) backed by projects/certifications`
      : 'No projects/certifications evidencing the required skills yet',
    ...(missing.length ? [`Skills to build: ${missing.join(', ')}`] : []),
  ];
  return {
    score,
    eligible: reasons.length === 0,
    ineligibleReasons: reasons,
    matchedSkills: matched,
    missingSkills: missing,
    evidenceBackedSkills: backed,
    explanation,
  };
}
