import { Injectable } from '@nestjs/common';
import { AccessService, isAdmin } from '../access/access.service';
import { P } from '../auth/permissions';
import { Principal } from '../common/types/principal';
import { documentWhere } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchHit {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
}
const PER_TYPE = 5;

/**
 * Global search. Each source applies the SAME scope rules as that module's list endpoint, so search can never
 * reveal more than the caller could browse. Private messages and AI chats are deliberately NOT searchable.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  async search(p: Principal, c: string, raw: string, types?: string[]) {
    const q = raw.trim().slice(0, 80);
    if (q.length < 2) return { query: q, results: [] as SearchHit[] };
    const want = (t: string) => !types?.length || types.includes(t);
    const has = (...perms: string[]) => perms.some((x) => p.permissions.includes(x));
    const ci = { contains: q, mode: 'insensitive' as const };
    const jobs: Promise<SearchHit[]>[] = [];

    if (want('students') && has(P.STUDENT_VIEW))
      jobs.push(
        this.prisma.student
          .findMany({
            where: {
              AND: [
                this.access.studentWhere(p, c),
                {
                  OR: [
                    { collegeStudentId: ci },
                    { rollNumber: ci },
                    { user: { firstName: ci } },
                    { user: { lastName: ci } },
                  ],
                },
              ],
            },
            take: PER_TYPE,
            select: {
              id: true,
              rollNumber: true,
              user: { select: { firstName: true, lastName: true } },
              department: { select: { code: true } },
            },
          })
          .then((r) =>
            r.map((s) => ({
              type: 'student',
              id: s.id,
              title: `${s.user.firstName} ${s.user.lastName}`,
              subtitle: `${s.rollNumber} · ${s.department.code}`,
            })),
          ),
      );
    if (want('teachers') && has(P.TEACHER_VIEW, P.ORG_VIEW))
      jobs.push(
        this.prisma.teacher
          .findMany({
            where: { collegeId: c, OR: [{ employeeId: ci }, { user: { firstName: ci } }, { user: { lastName: ci } }] },
            take: PER_TYPE,
            select: {
              id: true,
              designation: true,
              user: { select: { firstName: true, lastName: true } },
              department: { select: { code: true } },
            },
          })
          .then((r) =>
            r.map((t) => ({
              type: 'teacher',
              id: t.id,
              title: `${t.user.firstName} ${t.user.lastName}`,
              subtitle: `${t.designation ?? 'Faculty'} · ${t.department.code}`,
            })),
          ),
      );
    if (want('subjects') && has(P.ORG_VIEW))
      jobs.push(
        this.prisma.subject
          .findMany({ where: { collegeId: c, OR: [{ name: ci }, { code: ci }] }, take: PER_TYPE })
          .then((r) => r.map((s) => ({ type: 'subject', id: s.id, title: s.name, subtitle: s.code }))),
      );
    if (want('notices') && has(P.NOTICE_VIEW))
      jobs.push(
        this.prisma.notice
          .findMany({
            where: {
              collegeId: c,
              publishedAt: { not: null },
              title: ci,
              ...(isAdmin(p)
                ? {}
                : {
                    OR: [{ departmentId: null }, { departmentId: { in: p.departmentIds } }],
                    AND: [{ OR: [{ audienceRoles: { isEmpty: true } }, { audienceRoles: { hasSome: p.roleKeys } }] }],
                  }),
            },
            take: PER_TYPE,
            orderBy: { publishedAt: 'desc' },
          })
          .then((r) =>
            r.map((n) => ({
              type: 'notice',
              id: n.id,
              title: n.title,
              subtitle: n.publishedAt?.toISOString().slice(0, 10),
            })),
          ),
      );
    if (want('documents') && has(P.DOCUMENT_VIEW))
      jobs.push(
        this.prisma.document
          .findMany({ where: { AND: [documentWhere(p, c), { status: 'READY', title: ci }] }, take: PER_TYPE })
          .then((r) => r.map((d) => ({ type: 'document', id: d.id, title: d.title, subtitle: d.documentType }))),
      );
    if (want('assignments') && has(P.ASSIGNMENT_VIEW))
      jobs.push(
        this.prisma.assignment
          .findMany({
            where: {
              collegeId: c,
              title: ci,
              subjectOffering: p.studentId
                ? { enrollments: { some: { studentId: p.studentId } } }
                : this.access.offeringWhere(p, c),
            },
            take: PER_TYPE,
            orderBy: { dueAt: 'desc' },
            select: {
              id: true,
              title: true,
              dueAt: true,
              subjectOffering: { select: { subject: { select: { name: true } } } },
            },
          })
          .then((r) =>
            r.map((a) => ({
              type: 'assignment',
              id: a.id,
              title: a.title,
              subtitle: `${a.subjectOffering.subject.name} · due ${a.dueAt.toISOString().slice(0, 10)}`,
            })),
          ),
      );
    if (want('complaints') && has(P.COMPLAINT_VIEW_OWN, P.COMPLAINT_MANAGE)) {
      const scope =
        isAdmin(p) && has(P.COMPLAINT_MANAGE)
          ? {}
          : { OR: [{ complainantId: p.userId }, ...(has(P.COMPLAINT_MANAGE) ? [{ assignedToId: p.userId }] : [])] };
      jobs.push(
        this.prisma.complaint
          .findMany({
            where: { AND: [{ collegeId: c, OR: [{ subject: ci }, { ticketNo: ci }] }, scope] },
            take: PER_TYPE,
            orderBy: { createdAt: 'desc' },
          })
          .then((r) =>
            r.map((x) => ({ type: 'complaint', id: x.id, title: x.subject, subtitle: `${x.ticketNo} · ${x.status}` })),
          ),
      );
    }
    if (want('events') && has(P.EVENT_VIEW))
      jobs.push(
        this.prisma.campusEvent
          .findMany({ where: { collegeId: c, title: ci }, take: PER_TYPE, orderBy: { startsAt: 'desc' } })
          .then((r) =>
            r.map((e) => ({
              type: 'event',
              id: e.id,
              title: e.title,
              subtitle: e.startsAt.toISOString().slice(0, 10),
            })),
          ),
      );

    return { query: q, results: (await Promise.all(jobs)).flat() };
  }
}
/** Sources intentionally excluded from search (privacy): */
export const NOT_SEARCHABLE = ['messages', 'ai_conversations', 'audit_logs', 'payments'] as const;
