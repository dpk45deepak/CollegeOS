import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Complaint, ComplaintStatus, Prisma, Priority } from '@prisma/client';
import { isAdmin } from '../access/access.service';
import { AuditService } from '../audit/audit.service';
import { P, ROLE } from '../auth/permissions';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import { DomainEvents, NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { REALTIME_EMIT } from '../notifications/notifications.service';
import * as D from './dto/complaints.dto';
import { Routing, bumpPriority, canTransition, classifyComplaint, slaDueAt } from './workflow';

export interface CreateOptions {
  /** Pre-computed routing (e.g. from the AI router). Validated against rule-based safety overrides. */
  routing?: Routing;
  routedByAi?: boolean;
}

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly redis: RedisService,
  ) {}

  /** "Who should I contact?" — preview only; nothing is created. */
  async previewRoute(p: Principal, c: string, text: string) {
    const routing = classifyComplaint(text);
    const target = await this.resolveAssignee(c, routing, p);
    return {
      ...routing,
      assignee: target ? { userId: target.userId, name: target.name, role: routing.handlerRole } : null,
    };
  }

  async create(p: Principal, c: string, dto: D.CreateComplaintDto, opts: CreateOptions = {}) {
    const text = `${dto.subject}\n${dto.description}`;
    const rule = classifyComplaint(text, dto.category);
    // Safety override: if rules detect a sensitive report it wins over any AI/user-chosen routing.
    const routing =
      rule.priority === 'CRITICAL' && rule.handlerRole === ROLE.COLLEGE_ADMIN ? rule : (opts.routing ?? rule);
    const priority: Priority = dto.priority ?? routing.priority;
    const assignee = await this.resolveAssignee(c, routing, p);

    const ticketNo = await this.ticketNo(c);
    const complaint = await this.prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          collegeId: c,
          ticketNo,
          complainantId: p.userId,
          category: dto.category ?? routing.category,
          subject: dto.subject,
          description: dto.description,
          priority,
          status: assignee ? 'ASSIGNED' : 'OPEN',
          assignedToId: assignee?.userId,
          assignedDepartmentId: routing.departmental ? p.departmentIds[0] : undefined,
          slaDueAt: slaDueAt(priority),
          routedByAi: !!opts.routedByAi,
          aiRouting: { ...routing, source: opts.routedByAi ? 'ai' : 'rules' } as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.complaintEvent.create({
        data: {
          complaintId: created.id,
          actorId: p.userId,
          type: 'CREATED',
          note: assignee ? `Auto-routed to ${assignee.name}` : 'Awaiting assignment',
          metadata: { routing } as unknown as Prisma.InputJsonValue,
        },
      });
      return created;
    });
    this.events.emit(DomainEvents.ComplaintCreated, { collegeId: c, complaintId: complaint.id });
    if (assignee)
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: [assignee.userId],
        type: 'ComplaintAssigned',
        title: `New ${priority.toLowerCase()} complaint ${ticketNo}`,
        body: dto.subject,
        data: { complaintId: complaint.id },
      });
    return complaint;
  }

  private async resolveAssignee(c: string, r: Routing, p: Principal): Promise<{ userId: string; name: string } | null> {
    const where: Prisma.UserWhereInput = {
      collegeId: c,
      status: 'ACTIVE',
      userRoles: {
        some: {
          role: { collegeId: c, key: r.handlerRole },
          ...(r.departmental && p.departmentIds[0] ? { departmentId: p.departmentIds[0] } : {}),
        },
      },
    };
    const candidates = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: { complaintAssignees: { where: { status: { in: ['ASSIGNED', 'INVESTIGATING', 'ESCALATED'] } } } },
        },
      },
      take: 25,
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => a._count.complaintAssignees - b._count.complaintAssignees); // least loaded
    return { userId: candidates[0].id, name: `${candidates[0].firstName} ${candidates[0].lastName}` };
  }

  // ── reads ──────────────────────────────────────────
  async mine(p: Principal, c: string, q: D.ComplaintQueryDto) {
    const where: Prisma.ComplaintWhereInput = {
      collegeId: c,
      complainantId: p.userId,
      status: q.status,
      category: q.category,
    };
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(q) }),
      this.prisma.complaint.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  async queue(p: Principal, c: string, q: D.ComplaintQueryDto) {
    const scope: Prisma.ComplaintWhereInput = isAdmin(p)
      ? {}
      : {
          OR: [
            { assignedToId: p.userId },
            ...(p.roleKeys.includes(ROLE.HOD) && p.departmentIds.length
              ? [{ assignedDepartmentId: { in: p.departmentIds } }]
              : []),
          ],
        };
    const where: Prisma.ComplaintWhereInput = {
      AND: [{ collegeId: c, status: q.status, priority: q.priority, category: q.category }, scope],
    };
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { slaDueAt: 'asc' }],
        ...toSkipTake(q),
        include: { complainant: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  async get(p: Principal, c: string, id: string) {
    const complaint = await this.prisma.complaint.findFirst({ where: { id, collegeId: c } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    const manager = this.canManage(p, complaint);
    if (!manager && complaint.complainantId !== p.userId) throw new NotFoundException('Complaint not found');
    const events = await this.prisma.complaintEvent.findMany({
      where: { complaintId: id, ...(manager ? {} : { type: { not: 'INTERNAL_NOTE' } }) },
      orderBy: { createdAt: 'asc' },
    });
    return { ...complaint, events };
  }
  private canManage(p: Principal, c: Complaint): boolean {
    return (
      p.permissions.includes(P.COMPLAINT_MANAGE) &&
      (isAdmin(p) ||
        c.assignedToId === p.userId ||
        (!!c.assignedDepartmentId && p.departmentIds.includes(c.assignedDepartmentId)))
    );
  }

  // ── workflow ───────────────────────────────────────
  async changeStatus(p: Principal, c: string, id: string, dto: D.ChangeStatusDto) {
    const cur = await this.mustManage(p, c, id);
    if (!canTransition(cur.status, dto.status))
      throw new BadRequestException({
        message: `Cannot move ${cur.status} → ${dto.status}`,
        errorCode: 'INVALID_TRANSITION',
      });
    if (['ESCALATED'].includes(dto.status)) return this.escalate(cur.id, c, dto.note ?? 'Manually escalated', p.userId);
    const data: Prisma.ComplaintUpdateInput = { status: dto.status };
    if (dto.status === 'AWAITING_FEEDBACK') data.resolvedAt = new Date();
    if (dto.status === 'CLOSED') data.closedAt = new Date();
    const updated = await this.prisma.complaint.update({ where: { id }, data });
    await this.prisma.complaintEvent.create({
      data: { complaintId: id, actorId: p.userId, type: `STATUS_${dto.status}`, note: dto.note },
    });
    await this.audit.log({
      collegeId: c,
      userId: p.userId,
      action: 'COMPLAINT_STATUS',
      entity: 'Complaint',
      entityId: id,
      oldValue: cur.status,
      newValue: dto.status,
    });
    this.notifyComplainant(
      updated,
      dto.status === 'AWAITING_FEEDBACK'
        ? 'Your complaint was resolved — please share feedback'
        : `Complaint ${dto.status.toLowerCase().replace('_', ' ')}`,
      dto.note,
    );
    return updated;
  }

  async assign(p: Principal, c: string, id: string, dto: D.AssignComplaintDto) {
    const cur = await this.mustManage(p, c, id);
    const target = await this.prisma.user.findFirst({ where: { id: dto.userId, collegeId: c, status: 'ACTIVE' } });
    if (!target) throw new NotFoundException('Assignee not found');
    const next: ComplaintStatus =
      cur.status === 'OPEN' || cur.status === 'REOPENED' || cur.status === 'ESCALATED' ? 'ASSIGNED' : cur.status;
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { assignedToId: dto.userId, status: next },
    });
    await this.prisma.complaintEvent.create({
      data: { complaintId: id, actorId: p.userId, type: 'ASSIGNED', note: dto.note, metadata: { to: dto.userId } },
    });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: [dto.userId],
      type: 'ComplaintAssigned',
      title: `Complaint ${cur.ticketNo} assigned to you`,
      body: cur.subject,
      data: { complaintId: id },
    });
    return updated;
  }

  async comment(p: Principal, c: string, id: string, dto: D.CommentDto) {
    const cur = await this.prisma.complaint.findFirst({ where: { id, collegeId: c } });
    if (!cur) throw new NotFoundException();
    const manager = this.canManage(p, cur);
    if (!manager && cur.complainantId !== p.userId) throw new NotFoundException();
    const internal = manager && !!dto.internal;
    const ev = await this.prisma.complaintEvent.create({
      data: { complaintId: id, actorId: p.userId, type: internal ? 'INTERNAL_NOTE' : 'COMMENT', note: dto.note },
    });
    if (!internal)
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: [manager ? cur.complainantId : cur.assignedToId].filter((x): x is string => !!x),
        type: 'ComplaintComment',
        title: `Update on ${cur.ticketNo}`,
        body: dto.note.slice(0, 140),
        data: { complaintId: id },
      });
    return ev;
  }

  async feedback(p: Principal, c: string, id: string, dto: D.FeedbackDto) {
    const cur = await this.prisma.complaint.findFirst({ where: { id, collegeId: c, complainantId: p.userId } });
    if (!cur) throw new NotFoundException();
    if (cur.status !== 'AWAITING_FEEDBACK') throw new BadRequestException('Feedback is only accepted after resolution');
    const status: ComplaintStatus = dto.reopen ? 'REOPENED' : 'CLOSED';
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        feedbackRating: dto.rating,
        feedbackComment: dto.comment,
        status,
        closedAt: dto.reopen ? null : new Date(),
        resolvedAt: dto.reopen ? null : cur.resolvedAt,
        slaDueAt: dto.reopen ? slaDueAt(cur.priority) : cur.slaDueAt,
      },
    });
    await this.prisma.complaintEvent.create({
      data: {
        complaintId: id,
        actorId: p.userId,
        type: dto.reopen ? 'REOPENED' : 'CLOSED',
        note: dto.comment,
        metadata: { rating: dto.rating },
      },
    });
    if (dto.reopen && cur.assignedToId)
      this.events.emit(NOTIFY, {
        collegeId: c,
        userIds: [cur.assignedToId],
        type: 'ComplaintReopened',
        title: `${cur.ticketNo} reopened`,
        body: dto.comment ?? 'Student is not satisfied',
        data: { complaintId: id },
      });
    return updated;
  }

  // ── SLA escalation (scheduler) ─────────────────────
  async escalate(id: string, c: string, reason: string, actorId?: string) {
    const cur = await this.prisma.complaint.findUniqueOrThrow({ where: { id } });
    const level = cur.escalationLevel + 1;
    const priority = bumpPriority(cur.priority);
    // level 1 → department HOD (if any), level ≥2 → college admin
    const role = level === 1 && cur.assignedDepartmentId ? ROLE.HOD : ROLE.COLLEGE_ADMIN;
    const target = await this.prisma.user.findFirst({
      where: {
        collegeId: c,
        status: 'ACTIVE',
        userRoles: {
          some: {
            role: { collegeId: c, key: role },
            ...(role === ROLE.HOD ? { departmentId: cur.assignedDepartmentId } : {}),
          },
        },
      },
      select: { id: true },
    });
    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalationLevel: level,
        priority,
        assignedToId: target?.id ?? cur.assignedToId,
        slaDueAt: slaDueAt(priority),
      },
    });
    await this.prisma.complaintEvent.create({
      data: { complaintId: id, actorId, type: 'ESCALATED', note: reason, metadata: { level, priority } },
    });
    this.events.emit(DomainEvents.ComplaintEscalated, { collegeId: c, complaintId: id, level });
    this.events.emit(NOTIFY, {
      collegeId: c,
      userIds: [target?.id, cur.complainantId].filter((x): x is string => !!x),
      type: 'ComplaintEscalated',
      title: `${cur.ticketNo} escalated (level ${level})`,
      body: reason,
      data: { complaintId: id },
    });
    return updated;
  }

  /** Escalates every complaint past its SLA; auto-closes resolved ones with no feedback for 7 days. */
  async runSlaSweep(c: string): Promise<{ escalated: number; autoClosed: number }> {
    const overdue = await this.prisma.complaint.findMany({
      where: {
        collegeId: c,
        status: { in: ['OPEN', 'ASSIGNED', 'INVESTIGATING', 'REOPENED', 'ESCALATED'] },
        slaDueAt: { lt: new Date() },
        escalationLevel: { lt: 3 },
      },
      select: { id: true },
    });
    for (const o of overdue) await this.escalate(o.id, c, 'SLA breached — automatic escalation');
    const stale = await this.prisma.complaint.updateMany({
      where: { collegeId: c, status: 'AWAITING_FEEDBACK', resolvedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    return { escalated: overdue.length, autoClosed: stale.count };
  }

  private async mustManage(p: Principal, c: string, id: string) {
    const cur = await this.prisma.complaint.findFirst({ where: { id, collegeId: c } });
    if (!cur) throw new NotFoundException('Complaint not found');
    if (!this.canManage(p, cur))
      throw new ForbiddenException({ message: 'Not assigned to you', errorCode: 'SCOPE_DENIED' });
    return cur;
  }
  private notifyComplainant(cmp: Complaint, title: string, body?: string) {
    this.events.emit(NOTIFY, {
      collegeId: cmp.collegeId,
      userIds: [cmp.complainantId],
      type: 'ComplaintStatusChanged',
      title,
      body: body ?? cmp.subject,
      data: { complaintId: cmp.id, status: cmp.status },
    });
    this.events.emit(REALTIME_EMIT, {
      userId: cmp.complainantId,
      event: 'complaint.status',
      data: { complaintId: cmp.id, ticketNo: cmp.ticketNo, status: cmp.status },
    });
    this.events.emit(DomainEvents.ComplaintStatusChanged, {
      collegeId: cmp.collegeId,
      complaintId: cmp.id,
      status: cmp.status,
    });
  }
  private async ticketNo(c: string): Promise<string> {
    const y = new Date().getUTCFullYear();
    const n = await this.redis.safeIncr(`ticket:${c}:${y}`);
    if (n) {
      return `GRV-${y}-${String(n).padStart(5, '0')}`;
    }
    const count = await this.prisma.complaint.count({ where: { collegeId: c } });
    return `GRV-${y}-${String(count + 1).padStart(5, '0')}`;
  }
}
