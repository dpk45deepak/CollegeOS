import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ROLE } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';

/** Roles that may see every student/offering in their college. */
const COLLEGE_WIDE = [
  ROLE.SUPER_ADMIN,
  ROLE.COLLEGE_ADMIN,
  ROLE.ACCOUNTANT,
  ROLE.EXAM_CONTROLLER,
  ROLE.PLACEMENT_OFFICER,
  ROLE.SUPPORT_STAFF,
  ROLE.LIBRARY_STAFF,
] as string[];
const hasAny = (p: Principal, roles: string[]) => p.roleKeys.some((r) => roles.includes(r));
export const isAdmin = (p: Principal) => hasAny(p, [ROLE.SUPER_ADMIN, ROLE.COLLEGE_ADMIN]);

/**
 * Row-level scope rules ("who can see which student / offering"). Services AND these filters into
 * every query, so scope can never be skipped by guessing ids.
 */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  studentWhere(p: Principal, collegeId: string): Prisma.StudentWhereInput {
    const base: Prisma.StudentWhereInput = { collegeId };
    if (hasAny(p, COLLEGE_WIDE)) return base;
    const or: Prisma.StudentWhereInput[] = [];
    if (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.length) or.push({ departmentId: { in: p.departmentIds } });
    if (p.teacherId) or.push({ enrollments: { some: { subjectOffering: { teacherId: p.teacherId } } } });
    if (p.studentId) or.push({ id: p.studentId });
    if (p.guardianOfStudentIds.length) or.push({ id: { in: p.guardianOfStudentIds } });
    return or.length ? { ...base, OR: or } : { ...base, id: '__none__' };
  }

  offeringWhere(p: Principal, collegeId: string): Prisma.SubjectOfferingWhereInput {
    const base: Prisma.SubjectOfferingWhereInput = { collegeId };
    if (hasAny(p, COLLEGE_WIDE)) return base;
    const or: Prisma.SubjectOfferingWhereInput[] = [];
    if (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.length)
      or.push({ subject: { departmentId: { in: p.departmentIds } } });
    if (p.teacherId) or.push({ teacherId: p.teacherId });
    if (p.studentId) or.push({ enrollments: { some: { studentId: p.studentId } } });
    return or.length ? { ...base, OR: or } : { ...base, id: '__none__' };
  }

  async canAccessStudent(p: Principal, collegeId: string, studentId: string): Promise<boolean> {
    return (
      (await this.prisma.student.count({ where: { AND: [this.studentWhere(p, collegeId), { id: studentId }] } })) > 0
    );
  }
  async assertStudent(p: Principal, collegeId: string, studentId: string): Promise<void> {
    if (!(await this.canAccessStudent(p, collegeId, studentId)))
      throw new ForbiddenException({ message: 'Student is outside your scope', errorCode: 'SCOPE_DENIED' });
  }

  /** Teacher (or HOD of that department / admin) may act on this offering. */
  async assertManagesOffering(p: Principal, collegeId: string, offeringId: string) {
    const offering = await this.prisma.subjectOffering.findFirst({
      where: { id: offeringId, collegeId },
      include: { subject: { select: { id: true, name: true, departmentId: true } } },
    });
    if (!offering)
      throw new ForbiddenException({ message: 'Offering not found in your scope', errorCode: 'SCOPE_DENIED' });
    const allowed =
      isAdmin(p) ||
      (!!p.teacherId && offering.teacherId === p.teacherId) ||
      (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.includes(offering.subject.departmentId));
    if (!allowed)
      throw new ForbiddenException({ message: 'You are not assigned to this subject', errorCode: 'SCOPE_DENIED' });
    return offering;
  }

  /** Can this principal approve things belonging to a department (HOD of it, or admin)? */
  canReviewDepartment(p: Principal, departmentId: string): boolean {
    return isAdmin(p) || (p.roleKeys.includes(ROLE.HOD) && p.departmentIds.includes(departmentId));
  }
}
