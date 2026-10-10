import { ROLE } from '../auth/permissions';

export type Kind = 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'OTHER';
export function kindOf(roleKeys: string[]): Kind {
  if (roleKeys.some((r) => r === ROLE.COLLEGE_ADMIN || r === ROLE.SUPER_ADMIN)) return 'ADMIN';
  if (roleKeys.includes(ROLE.HOD)) return 'HOD';
  if (roleKeys.includes(ROLE.TEACHER)) return 'TEACHER';
  if (roleKeys.includes(ROLE.STUDENT)) return 'STUDENT';
  return 'OTHER';
}

/**
 * Allowed direct-message pairs (Student↔Teacher, Student↔Admin, Teacher↔HOD, admins to anyone).
 * Relationship checks (does this teacher teach that student?) happen in the service on top of this matrix.
 */
const ALLOWED: Record<Kind, Kind[]> = {
  STUDENT: ['TEACHER', 'HOD', 'ADMIN'],
  TEACHER: ['STUDENT', 'HOD', 'ADMIN'],
  HOD: ['TEACHER', 'STUDENT', 'ADMIN', 'HOD'],
  ADMIN: ['STUDENT', 'TEACHER', 'HOD', 'ADMIN', 'OTHER'],
  OTHER: ['ADMIN'],
};
export const canPairMessage = (from: Kind, to: Kind): boolean => ALLOWED[from].includes(to);
