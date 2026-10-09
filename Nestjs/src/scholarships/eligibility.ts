export interface ScholarshipEligibility {
  minCgpa?: number;
  minAttendance?: number;
  programs?: string[]; // program codes
  departments?: string[]; // department ids
  semesters?: number[]; // allowed current semester numbers
  maxFamilyIncome?: number; // cannot be auto-checked (not stored) → "verify"
  requiresDocuments?: boolean;
}
export interface StudentProfileForMatching {
  cgpa: number | null;
  attendance: number | null;
  programCode: string;
  departmentId: string;
  semesterNumber: number | null;
}
export type Fit = 'ELIGIBLE' | 'POSSIBLE' | 'NOT_ELIGIBLE';
export interface MatchResult {
  fit: Fit;
  met: string[];
  unmet: string[];
  toVerify: string[];
}

/** Rule-based, explainable match. Deliberately uses only academic criteria the college stores. */
export function matchScholarship(
  s: StudentProfileForMatching,
  e: ScholarshipEligibility | null | undefined,
): MatchResult {
  const r: MatchResult = { fit: 'ELIGIBLE', met: [], unmet: [], toVerify: [] };
  if (!e) {
    r.toVerify.push('No structured eligibility rules — read the scholarship description');
    r.fit = 'POSSIBLE';
    return r;
  }
  const check = (cond: boolean | null, label: string) =>
    cond === null ? r.toVerify.push(label) : cond ? r.met.push(label) : r.unmet.push(label);
  if (e.minCgpa !== undefined) check(s.cgpa === null ? null : s.cgpa >= e.minCgpa, `CGPA ≥ ${e.minCgpa}`);
  if (e.minAttendance !== undefined)
    check(s.attendance === null ? null : s.attendance >= e.minAttendance, `Attendance ≥ ${e.minAttendance}%`);
  if (e.programs?.length) check(e.programs.includes(s.programCode), `Program in ${e.programs.join('/')}`);
  if (e.departments?.length) check(e.departments.includes(s.departmentId), 'Department eligible');
  if (e.semesters?.length)
    check(
      s.semesterNumber === null ? null : e.semesters.includes(s.semesterNumber),
      `Semester in ${e.semesters.join('/')}`,
    );
  if (e.maxFamilyIncome !== undefined) r.toVerify.push(`Family income ≤ ${e.maxFamilyIncome} (needs documents)`);
  r.fit = r.unmet.length ? 'NOT_ELIGIBLE' : r.toVerify.length ? 'POSSIBLE' : 'ELIGIBLE';
  return r;
}
