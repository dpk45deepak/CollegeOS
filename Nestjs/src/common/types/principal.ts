import type { Request } from 'express';

export interface Principal {
  userId: string;
  collegeId: string | null; // null only for SUPER_ADMIN
  sessionId: string;
  roleKeys: string[];
  permissions: string[];
  /** Departments the user belongs to or administers (HOD scope, teacher/student home dept). */
  departmentIds: string[];
  studentId?: string;
  teacherId?: string;
  guardianOfStudentIds: string[];
  isSuperAdmin: boolean;
}

export interface AuthedRequest extends Request {
  user?: Principal;
  tenantId?: string;
}
