import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { AccessService } from '../access/access.service';
import { isAdmin } from '../access/access.service';
import { ROLE } from '../auth/permissions';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { REALTIME_EMIT } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { canPairMessage, kindOf } from './messaging-policy';
import * as D from './dto/messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly events: EventEmitter2,
  ) {}

  async start(p: Principal, c: string, dto: D.StartConversationDto) {
    if (dto.recipientUserId === p.userId) throw new BadRequestException('Cannot message yourself');
    const other = await this.prisma.user.findFirst({
      where: { id: dto.recipientUserId, collegeId: c, status: 'ACTIVE' },
      select: {
        id: true,
        userRoles: { select: { role: { select: { key: true } }, departmentId: true } },
        student: { select: { id: true } },
        teacher: { select: { id: true, departmentId: true } },
      },
    });
    if (!other) throw new NotFoundException('Recipient not found');
    const otherRoles = other.userRoles.map((r) => r.role.key);
    if (!canPairMessage(kindOf(p.roleKeys), kindOf(otherRoles)))
      throw new ForbiddenException({ message: 'You cannot message this user', errorCode: 'MESSAGE_NOT_ALLOWED' });
    await this.assertRelationship(p, c, other);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        collegeId: c,
        type: 'DIRECT',
        AND: [{ participants: { some: { userId: p.userId } } }, { participants: { some: { userId: other.id } } }],
      },
      select: { id: true },
    });
    const convId =
      existing?.id ??
      (
        await this.prisma.conversation.create({
          data: {
            collegeId: c,
            type: 'DIRECT',
            createdById: p.userId,
            participants: { create: [{ userId: p.userId }, { userId: other.id }] },
          },
        })
      ).id;
    const message = await this.post(p, c, convId, dto.message);
    return { conversationId: convId, message };
  }

  private async assertRelationship(
    p: Principal,
    c: string,
    other: {
      userRoles: { role: { key: string }; departmentId: string | null }[];
      student: { id: string } | null;
      teacher: { id: string; departmentId: string } | null;
    },
  ) {
    if (isAdmin(p)) return;
    const mine = kindOf(p.roleKeys);
    if (mine === 'STUDENT' && p.studentId) {
      if (other.teacher) {
        const ok = await this.prisma.enrollment.count({
          where: { studentId: p.studentId, subjectOffering: { teacherId: other.teacher.id } },
        });
        const isHod = other.userRoles.some(
          (ur) => ur.role.key === ROLE.HOD && p.departmentIds.includes(ur.departmentId || other.teacher!.departmentId),
        );
        if (!ok && !isHod)
          throw new ForbiddenException({
            message: 'You can only message teachers of your subjects or your HOD',
            errorCode: 'MESSAGE_NOT_ALLOWED',
          });
      } else {
        const otherIsHod = other.userRoles.some((ur) => ur.role.key === ROLE.HOD);
        const sameDeptHod = other.userRoles.some(
          (ur) => ur.role.key === ROLE.HOD && !!ur.departmentId && p.departmentIds.includes(ur.departmentId),
        );
        if (otherIsHod && !sameDeptHod) {
          throw new ForbiddenException({
            message: 'You can only message your own department HOD',
            errorCode: 'MESSAGE_NOT_ALLOWED',
          });
        }
      }
    }
    if (mine === 'PARENT') {
      if (!p.guardianOfStudentIds.length) {
        throw new ForbiddenException({ message: 'No linked ward found', errorCode: 'MESSAGE_NOT_ALLOWED' });
      }
      if (other.teacher) {
        const teachesWard = await this.prisma.enrollment.count({
          where: { studentId: { in: p.guardianOfStudentIds }, subjectOffering: { teacherId: other.teacher.id } },
        });
        const wardDepts = await this.prisma.student.findMany({
          where: { id: { in: p.guardianOfStudentIds } },
          select: { departmentId: true },
        });
        const wardDeptIds = wardDepts.map((w) => w.departmentId);
        const isWardHod = other.userRoles.some(
          (ur) => ur.role.key === ROLE.HOD && wardDeptIds.includes(ur.departmentId || other.teacher!.departmentId),
        );
        if (!teachesWard && !isWardHod) {
          throw new ForbiddenException({
            message: 'Parents can only message teachers or HOD of their ward',
            errorCode: 'MESSAGE_NOT_ALLOWED',
          });
        }
      } else if (other.student && !p.guardianOfStudentIds.includes(other.student.id)) {
        throw new ForbiddenException({ message: 'That student is outside your ward scope', errorCode: 'MESSAGE_NOT_ALLOWED' });
      }
    }
    if (
      (mine === 'TEACHER' || mine === 'HOD') &&
      other.student &&
      !(await this.access.canAccessStudent(p, c, other.student.id))
    ) {
      throw new ForbiddenException({ message: 'That student is outside your scope', errorCode: 'MESSAGE_NOT_ALLOWED' });
    }
    if (mine === 'TEACHER' && other.teacher && !p.departmentIds.includes(other.teacher.departmentId)) {
      throw new ForbiddenException({
        message: 'Teachers can message colleagues only through their HOD',
        errorCode: 'MESSAGE_NOT_ALLOWED',
      });
    }
    if (mine === 'HOD') {
      const otherDept =
        other.teacher?.departmentId ??
        other.userRoles.find((ur) => ur.departmentId)?.departmentId;
      if (otherDept && !p.departmentIds.includes(otherDept)) {
        throw new ForbiddenException({
          message: 'HOD can only message members within their department',
          errorCode: 'MESSAGE_NOT_ALLOWED',
        });
      }
    }
  }

  /** Lists eligible recipients in the tenant according to caller's role & relationship scope. */
  async listRecipients(p: Principal, c: string, search?: string) {
    const searchFilter = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { loginId: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const mine = kindOf(p.roleKeys);
    let scopeWhere: Prisma.UserWhereInput = { collegeId: c, status: 'ACTIVE', id: { not: p.userId } };

    if (!isAdmin(p)) {
      if (mine === 'STUDENT') {
        scopeWhere = {
          ...scopeWhere,
          OR: [
            ...(p.studentId
              ? [{ teacher: { subjectOfferings: { some: { enrollments: { some: { studentId: p.studentId } } } } } }]
              : []),
            { userRoles: { some: { role: { key: ROLE.HOD }, departmentId: { in: p.departmentIds } } } },
            { userRoles: { some: { role: { key: { in: [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN] } } } } },
          ],
        };
      } else if (mine === 'PARENT') {
        const wards = p.guardianOfStudentIds.length
          ? await this.prisma.student.findMany({
              where: { id: { in: p.guardianOfStudentIds } },
              select: { departmentId: true },
            })
          : [];
        const wardDepts = wards.map((w) => w.departmentId);
        scopeWhere = {
          ...scopeWhere,
          OR: [
            ...(p.guardianOfStudentIds.length
              ? [
                  {
                    teacher: {
                      subjectOfferings: { some: { enrollments: { some: { studentId: { in: p.guardianOfStudentIds } } } } },
                    },
                  },
                ]
              : []),
            ...(wardDepts.length
              ? [{ userRoles: { some: { role: { key: ROLE.HOD }, departmentId: { in: wardDepts } } } }]
              : []),
            { userRoles: { some: { role: { key: { in: [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN] } } } } },
          ],
        };
      } else if (mine === 'HOD') {
        scopeWhere = {
          ...scopeWhere,
          OR: [
            { student: { departmentId: { in: p.departmentIds } } },
            { teacher: { departmentId: { in: p.departmentIds } } },
            { userRoles: { some: { role: { key: { in: [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN] } } } } },
          ],
        };
      } else if (mine === 'TEACHER') {
        scopeWhere = {
          ...scopeWhere,
          OR: [
            ...(p.teacherId
              ? [{ student: { enrollments: { some: { subjectOffering: { teacherId: p.teacherId } } } } }]
              : []),
            { teacher: { departmentId: { in: p.departmentIds } } },
            { userRoles: { some: { role: { key: ROLE.HOD }, departmentId: { in: p.departmentIds } } } },
            { userRoles: { some: { role: { key: { in: [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN] } } } } },
          ],
        };
      } else {
        scopeWhere = {
          ...scopeWhere,
          userRoles: { some: { role: { key: { in: [ROLE.COLLEGE_ADMIN, ROLE.SUPER_ADMIN] } } } },
        };
      }
    }

    return this.prisma.user.findMany({
      where: { AND: [scopeWhere, searchFilter] },
      select: {
        id: true,
        loginId: true,
        firstName: true,
        lastName: true,
        email: true,
        userRoles: { select: { role: { select: { key: true } }, departmentId: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 50,
    });
  }

  async send(p: Principal, c: string, conversationId: string, content: string) {
    const conv = await this.participantConversation(p, c, conversationId);
    if (conv.type === 'DEPARTMENT_ANNOUNCEMENT' && !(isAdmin(p) || p.roleKeys.includes('HOD')))
      throw new ForbiddenException('Announcements are read-only');
    return this.post(p, c, conversationId, content);
  }

  private async post(p: Principal, c: string, conversationId: string, content: string) {
    const msg = await this.prisma.message.create({ data: { conversationId, senderId: p.userId, content } });
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: p.userId } },
      select: { userId: true },
    });
    const ids = participants.map((x) => x.userId);
    for (const userId of ids)
      this.events.emit(REALTIME_EMIT, { userId, event: 'message', data: { conversationId, message: msg } });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: ids,
      type: 'NewMessage',
      title: 'New message',
      body: content.slice(0, 80),
      data: { conversationId },
    });
    return msg;
  }

  async announce(p: Principal, c: string, dto: D.AnnouncementDto) {
    const dept = await this.prisma.department.findFirst({ where: { id: dto.departmentId, collegeId: c } });
    if (!dept) throw new NotFoundException('Department not found');
    if (!this.access.canReviewDepartment(p, dept.id))
      throw new ForbiddenException('Only the HOD or an admin can announce to a department');
    let conv = await this.prisma.conversation.findFirst({
      where: { collegeId: c, type: 'DEPARTMENT_ANNOUNCEMENT', departmentId: dept.id },
    });
    conv ??= await this.prisma.conversation.create({
      data: {
        collegeId: c,
        type: 'DEPARTMENT_ANNOUNCEMENT',
        departmentId: dept.id,
        title: dto.title ?? `${dept.code} announcements`,
        createdById: p.userId,
      },
    });
    const members = await this.prisma.user.findMany({
      where: { collegeId: c, OR: [{ student: { departmentId: dept.id } }, { teacher: { departmentId: dept.id } }] },
      select: { id: true },
    });
    await this.prisma.conversationParticipant.createMany({
      data: [...members.map((m) => m.id), p.userId].map((userId) => ({ conversationId: conv.id, userId })),
      skipDuplicates: true,
    });
    return this.post(p, c, conv.id, dto.content);
  }

  async conversations(p: Principal, c: string, q: PaginationQueryDto) {
    const where = { collegeId: c, participants: { some: { userId: p.userId } } };
    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { messages: { _count: 'desc' } },
        ...toSkipTake(q),
        include: {
          participants: {
            select: { userId: true, lastReadAt: true, user: { select: { firstName: true, lastName: true } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    const mine = items.map((cv) => {
      const me = cv.participants.find((x) => x.userId === p.userId);
      return {
        id: cv.id,
        type: cv.type,
        title: cv.title,
        participants: cv.participants
          .filter((x) => x.userId !== p.userId)
          .map((x) => ({ userId: x.userId, name: `${x.user.firstName} ${x.user.lastName}` })),
        lastMessage: cv.messages[0] ?? null,
        hasUnread:
          !!cv.messages[0] &&
          cv.messages[0].senderId !== p.userId &&
          (!me?.lastReadAt || me.lastReadAt < cv.messages[0].createdAt),
      };
    });
    return paginate(mine, total, q);
  }

  async messages(p: Principal, c: string, conversationId: string, q: PaginationQueryDto) {
    await this.participantConversation(p, c, conversationId);
    const where = { conversationId };
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(q) }),
      this.prisma.message.count({ where }),
    ]);
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: p.userId },
      data: { lastReadAt: new Date() },
    });
    return paginate(items, total, q);
  }

  private async participantConversation(p: Principal, c: string, id: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id, collegeId: c, participants: { some: { userId: p.userId } } },
    });
    if (!conv) throw new NotFoundException('Conversation not found'); // existence of others' conversations is never revealed
    return conv;
  }
}
