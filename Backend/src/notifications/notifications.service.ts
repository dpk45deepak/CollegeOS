import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Job, Queue } from 'bullmq';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { AttendanceShortageEvent, DomainEvents, NOTIFY, NotifyUsersEvent } from '../common/events';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES } from '../queue/queue.constants';
import { ChannelProvider, EmailChannel, PushChannel, WhatsAppChannel } from './channels/channels';
import { externalChannels } from './notification-policy';

export const REALTIME_EMIT = 'realtime.emit';
export interface RealtimeEmit {
  userId?: string;
  room?: string;
  event: string;
  data: unknown;
}
interface DispatchJob {
  notificationId: string;
  userId: string;
  channels: ('EMAIL' | 'PUSH' | 'WHATSAPP')[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    @InjectQueue(QUEUES.NOTIFICATION) private readonly queue: Queue<DispatchJob>,
  ) {}

  /** Persist in-app notifications, push them over WebSocket, and queue external channels. */
  @OnEvent(NOTIFY, { async: true, promisify: true })
  async onNotify(e: NotifyUsersEvent): Promise<void> {
    const userIds = [...new Set(e.userIds)];
    if (!userIds.length) return;
    try {
      const parents = new Set(
        (
          await this.prisma.userRole.findMany({
            where: { userId: { in: userIds }, role: { key: 'PARENT' } },
            select: { userId: true },
          })
        ).map((r) => r.userId),
      );
      for (const userId of userIds) {
        const n = await this.prisma.notification.create({
          data: {
            collegeId: e.collegeId,
            userId,
            type: e.type,
            title: e.title,
            body: e.body,
            data: e.data as Prisma.InputJsonValue | undefined,
          },
        });
        this.events.emit(REALTIME_EMIT, {
          userId,
          event: 'notification',
          data: { id: n.id, type: n.type, title: n.title, body: n.body, data: e.data, createdAt: n.createdAt },
        } satisfies RealtimeEmit);
        const channels = externalChannels(e.type, parents.has(userId));
        if (channels.length) await this.queue.add('dispatch', { notificationId: n.id, userId, channels });
      }
    } catch (err) {
      this.logger.error({ err }, 'Failed to create notifications');
    }
  }

  /** Attendance shortage → student + subject teachers + (optionally) parents. */
  @OnEvent(DomainEvents.AttendanceShortageDetected, { async: true, promisify: true })
  async onShortage(e: AttendanceShortageEvent): Promise<void> {
    const subject = e.subjectName ? ` in ${e.subjectName}` : '';
    const need =
      e.classesNeeded && e.classesNeeded > 0
        ? ` Attend the next ${e.classesNeeded} class(es) to get back to ${e.threshold}%.`
        : '';
    await this.onNotify({
      collegeId: e.collegeId,
      userIds: [e.studentUserId],
      type: 'AttendanceShortageDetected',
      title: 'Attendance shortage',
      body: `Your attendance${subject} is ${e.percentage}% (minimum ${e.threshold}%).${need}`,
      data: { studentId: e.studentId, subjectId: e.subjectId },
    });
    if (e.teacherUserIds.length)
      await this.onNotify({
        collegeId: e.collegeId,
        userIds: e.teacherUserIds,
        type: 'AttendanceShortageDetected',
        title: 'Student below attendance threshold',
        body: `A student${subject} is at ${e.percentage}%.`,
        data: { studentId: e.studentId },
      });
    if (e.parentUserIds.length)
      await this.onNotify({
        collegeId: e.collegeId,
        userIds: e.parentUserIds,
        type: 'AttendanceShortageDetected',
        title: 'Attendance alert for your ward',
        body: `Attendance${subject} is ${e.percentage}% (minimum ${e.threshold}%).`,
        data: { studentId: e.studentId },
      });
  }

  async list(userId: string, q: PaginationQueryDto, unreadOnly?: boolean) {
    const where: Prisma.NotificationWhereInput = { userId, ...(unreadOnly ? { readAt: null } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(q) }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } }).then((count) => ({ count }));
  }
  async markRead(userId: string, ids?: string[]) {
    const r = await this.prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
    return { updated: r.count };
  }
  registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.pushDevice.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }
}

@Processor(QUEUES.NOTIFICATION, { autorun: !process.env.VERCEL })
export class NotificationProcessor extends WorkerHost {
  private readonly providers: Map<string, ChannelProvider>;
  constructor(
    private readonly prisma: PrismaService,
    email: EmailChannel,
    push: PushChannel,
    wa: WhatsAppChannel,
  ) {
    super();
    this.providers = new Map<string, ChannelProvider>([
      [email.channel, email],
      [push.channel, push],
      [wa.channel, wa],
    ]);
  }

  async process(job: Job<DispatchJob>): Promise<void> {
    const { notificationId, userId, channels } = job.data;
    const [n, user] = await Promise.all([
      this.prisma.notification.findUnique({ where: { id: notificationId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          pushDeviceUsers: { select: { token: true } },
          userRoles: { select: { role: { select: { key: true } } } },
        },
      }),
    ]);
    if (!n || !user) return;
    const to = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      pushTokens: user.pushDeviceUsers.map((d) => d.token),
      isParent: user.userRoles.some((r) => r.role.key === 'PARENT'),
    };
    const failures: string[] = [];
    for (const ch of channels) {
      try {
        await this.providers.get(ch)?.send(to, { id: n.id, type: n.type, title: n.title, body: n.body, data: n.data });
      } catch (e) {
        failures.push(`${ch}: ${(e as Error).message}`);
      }
    }
    await this.prisma.notification.update({ where: { id: n.id }, data: { sentAt: new Date() } });
    if (failures.length) throw new Error(failures.join('; ')); // triggers BullMQ retry/backoff, then dead-letter set
  }
}
