import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { isAdmin } from '../access/access.service';
import { OwnershipService } from '../access/ownership.service';
import { AuditService } from '../audit/audit.service';
import { ROLE } from '../auth/permissions';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { REALTIME_EMIT } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as D from './dto/campus.dto';

@Injectable()
export class CampusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly own: OwnershipService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly storage: StorageService,
  ) {}

  // ── notices ────────────────────────────────────────
  async createNotice(p: Principal, c: string, dto: D.CreateNoticeDto) {
    await this.own.assert('department', dto.departmentId, c);
    if (dto.attachmentKeys) this.storage.assertKeysBelong(dto.attachmentKeys, c);
    // HODs may only target their own department.
    if (!isAdmin(p) && p.roleKeys.includes(ROLE.HOD) && dto.departmentId && !p.departmentIds.includes(dto.departmentId))
      throw new ForbiddenException('Not your department');
    return this.prisma.notice.create({
      data: {
        ...dto,
        audienceRoles: dto.audienceRoles ?? [],
        attachmentKeys: dto.attachmentKeys ?? [],
        collegeId: c,
        authorId: p.userId,
      },
    });
  }

  async publishNotice(p: Principal, c: string, id: string) {
    const n = await this.prisma.notice.findFirst({ where: { id, collegeId: c } });
    if (!n) throw new NotFoundException();
    if (n.publishedAt) throw new BadRequestException('Already published');
    if (
      !isAdmin(p) &&
      !(p.roleKeys.includes(ROLE.HOD) && (!n.departmentId || p.departmentIds.includes(n.departmentId))) &&
      !p.roleKeys.includes(ROLE.PLACEMENT_OFFICER)
    ) {
      throw new ForbiddenException('You cannot publish this notice');
    }
    const published = await this.prisma.notice.update({ where: { id }, data: { publishedAt: new Date() } });
    await this.audit.log({ collegeId: c, userId: p.userId, action: 'NOTICE_PUBLISH', entity: 'Notice', entityId: id });

    const roleFilter: Prisma.UserWhereInput = n.audienceRoles.length
      ? { userRoles: { some: { role: { key: { in: n.audienceRoles } } } } }
      : {};
    const deptFilter: Prisma.UserWhereInput = n.departmentId
      ? { OR: [{ student: { departmentId: n.departmentId } }, { teacher: { departmentId: n.departmentId } }] }
      : {};
    const users = await this.prisma.user.findMany({
      where: { collegeId: c, status: 'ACTIVE', AND: [roleFilter, deptFilter] },
      select: { id: true },
      take: 20000,
    });
    this.events.emit(DomainEvents.NoticePublished, { collegeId: c, noticeId: id });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: users.map((u) => u.id),
      type: 'NoticePublished',
      title: n.title,
      body: n.body.slice(0, 140),
      data: { noticeId: id },
    });
    this.events.emit(REALTIME_EMIT, {
      room: `tenant:${c}`,
      event: 'announcement',
      data: { noticeId: id, title: n.title },
    });
    return published;
  }

  /** Published, unexpired notices relevant to the caller (their department or college-wide, their role or all). */
  async listNotices(p: Principal, c: string, q: PaginationQueryDto) {
    const staff = isAdmin(p);
    const where: Prisma.NoticeWhereInput = {
      collegeId: c,
      publishedAt: { not: null },
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ...(staff
          ? []
          : [
              { OR: [{ departmentId: null }, { departmentId: { in: p.departmentIds } }] },
              { OR: [{ audienceRoles: { isEmpty: true } }, { audienceRoles: { hasSome: p.roleKeys } }] },
            ]),
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        ...toSkipTake(q),
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.notice.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  myDrafts(p: Principal, c: string) {
    return this.prisma.notice.findMany({
      where: { collegeId: c, authorId: p.userId, publishedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── clubs & events ─────────────────────────────────
  createClub(c: string, dto: D.CreateClubDto) {
    return this.prisma.club.create({ data: { ...dto, collegeId: c } });
  }
  listClubs(c: string) {
    return this.prisma.club.findMany({ where: { collegeId: c }, orderBy: { name: 'asc' } });
  }
  async createEvent(c: string, dto: D.CreateEventDto) {
    if (dto.clubId && !(await this.prisma.club.count({ where: { id: dto.clubId, collegeId: c } })))
      throw new NotFoundException('club not found');
    if (dto.endsAt && dto.endsAt <= dto.startsAt) throw new BadRequestException('endsAt must be after startsAt');
    return this.prisma.campusEvent.create({ data: { ...dto, collegeId: c } });
  }
  async updateEvent(c: string, id: string, dto: D.UpdateEventDto) {
    if (!(await this.prisma.campusEvent.count({ where: { id, collegeId: c } }))) throw new NotFoundException();
    return this.prisma.campusEvent.update({ where: { id }, data: dto });
  }
  async listEvents(c: string, q: PaginationQueryDto, upcoming = true) {
    const where: Prisma.CampusEventWhereInput = {
      collegeId: c,
      ...(upcoming ? { startsAt: { gte: new Date() } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.campusEvent.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        ...toSkipTake(q),
        include: { club: { select: { name: true } } },
      }),
      this.prisma.campusEvent.count({ where }),
    ]);
    return paginate(items, total, q);
  }
}
