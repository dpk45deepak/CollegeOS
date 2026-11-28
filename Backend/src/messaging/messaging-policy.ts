import { ROLE } from '../auth/permissions';

export type Kind = 'STUDENT' | 'TEACHER' | 'HOD' | 'ADMIN' | 'PARENT' | 'OTHER';
export function kindOf(roleKeys: string[]): Kind {
  if (roleKeys.some((r) => r === ROLE.COLLEGE_ADMIN || r === ROLE.SUPER_ADMIN)) return 'ADMIN';
  if (roleKeys.includes(ROLE.HOD)) return 'HOD';
  if (roleKeys.includes(ROLE.TEACHER)) return 'TEACHER';
  if (roleKeys.includes(ROLE.STUDENT)) return 'STUDENT';
  if (roleKeys.includes(ROLE.PARENT)) return 'PARENT';
  return 'OTHER';
}

/**
 * Allowed direct-message pairs (Student↔Teacher, Parent↔Teacher/HOD, Student↔Admin, Teacher↔HOD, admins to anyone).
 * Relationship checks (does this teacher teach that student?) happen in the service on top of this matrix.
 */
const ALLOWED: Record<Kind, Kind[]> = {
  STUDENT: ['TEACHER', 'HOD', 'ADMIN'],
  PARENT: ['TEACHER', 'HOD', 'ADMIN'],
  TEACHER: ['STUDENT', 'PARENT', 'HOD', 'ADMIN'],
  HOD: ['TEACHER', 'STUDENT', 'PARENT', 'ADMIN', 'HOD'],
  ADMIN: ['STUDENT', 'PARENT', 'TEACHER', 'HOD', 'ADMIN', 'OTHER'],
  OTHER: ['ADMIN'],
};
export const canPairMessage = (from: Kind, to: Kind): boolean => ALLOWED[from].includes(to);
