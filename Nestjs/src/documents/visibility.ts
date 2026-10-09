import { DocumentVisibility } from '@prisma/client';
import { ADMIN_ROLES, ROLE, STAFF_ROLES } from '../auth/permissions';
import { Principal } from '../common/types/principal';

export interface VisibilityGrant {
  /** Admins see everything in their tenant. */
  all: boolean;
  visibilities: DocumentVisibility[];
  departmentIds: string[];
  roleKeys: string[];
}

/**
 * Single source of truth for "which documents may this user read?". It is applied (a) in SQL, before any
 * chunk is retrieved, and (b) on single-document access. The LLM is never asked to enforce permissions.
 *
 *  PUBLIC            everyone
 *  STUDENTS          students, parents and all staff
 *  TEACHERS          teachers, HODs, admins
 *  STAFF             all staff roles
 *  DEPARTMENT        members of that department (student/teacher/HOD) and admins
 *  ROLE_RESTRICTED   roles listed on the document
 *  ADMIN_ONLY        college admins only
 */
export function visibilityGrant(p: Pick<Principal, 'roleKeys' | 'departmentIds'>): VisibilityGrant {
  const roles = p.roleKeys;
  if (roles.some((r) => ADMIN_ROLES.includes(r)))
    return { all: true, visibilities: Object.values(DocumentVisibility), departmentIds: [], roleKeys: roles };
  const v = new Set<DocumentVisibility>(['PUBLIC']);
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));
  if (roles.includes(ROLE.STUDENT) || roles.includes(ROLE.PARENT) || isStaff) v.add('STUDENTS');
  if (roles.includes(ROLE.TEACHER) || roles.includes(ROLE.HOD)) v.add('TEACHERS');
  if (isStaff) v.add('STAFF');
  return { all: false, visibilities: [...v], departmentIds: p.departmentIds, roleKeys: roles };
}

export interface DocLike {
  visibility: DocumentVisibility;
  departmentId: string | null;
  allowedRoleKeys: string[];
}

export function canViewDocument(p: Pick<Principal, 'roleKeys' | 'departmentIds'>, d: DocLike): boolean {
  const g = visibilityGrant(p);
  if (g.all) return true;
  switch (d.visibility) {
    case 'DEPARTMENT':
      return !!d.departmentId && g.departmentIds.includes(d.departmentId);
    case 'ROLE_RESTRICTED':
      return d.allowedRoleKeys.some((r) => g.roleKeys.includes(r));
    case 'ADMIN_ONLY':
      return false;
    default:
      return g.visibilities.includes(d.visibility);
  }
}
