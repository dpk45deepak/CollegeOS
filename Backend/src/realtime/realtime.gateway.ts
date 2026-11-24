import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserStatus } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import { AccessService } from '../access/access.service';
import { revokedKey } from '../common/guards/jwt-auth.guard';
import { Principal } from '../common/types/principal';
import { REALTIME_EMIT, RealtimeEmit } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
import { PrincipalService } from '../security/principal.service';
import { TokenService } from '../security/token.service';
import { PrismaService } from '../prisma/prisma.service';

export interface SocketData {
  principal?: Principal;
}

/**
 * Authenticated Socket.IO namespace. Clients connect with `io('/realtime', { auth: { token: <accessToken> } })`.
 * Rooms: user:<id> (private), tenant:<collegeId> (announcements), offering:<id> (live attendance, teachers only).
 */
@WebSocketGateway({ namespace: '/realtime' })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: Server;

  constructor(
    private readonly tokens: TokenService,
    private readonly principals: PrincipalService,
    private readonly redis: RedisService,
    private readonly access: AccessService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const raw = (socket.handshake.auth as { token?: string } | undefined)?.token;
      if (!raw) throw new Error('missing token');
      const payload = this.tokens.verifyAccess(raw);
      let isRevoked = false;
      if (this.redis.isHealthy()) {
        isRevoked = await this.redis.safeExists(revokedKey(payload.sid));
      }
      if (!isRevoked && !this.redis.isHealthy()) {
        const session = await this.prisma.authSession.findUnique({
          where: { id: payload.sid },
          select: { revokedAt: true },
        });
        isRevoked = !session || !!session.revokedAt;
      }
      if (isRevoked) throw new Error('revoked');
      const p = await this.principals.load(payload.sub);
      if (!p || p.status !== UserStatus.ACTIVE) throw new Error('inactive');
      const { status: _s, ...rest } = p;
      (socket.data as SocketData).principal = { ...rest, sessionId: payload.sid };
      await socket.join(`user:${p.userId}`);
      if (p.collegeId) await socket.join(`tenant:${p.collegeId}`);
      socket.emit('ready', { userId: p.userId });
    } catch {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect(true);
    }
  }

  principalOf(socket: Socket): Principal | undefined {
    return (socket.data as SocketData).principal;
  }

  /** Teachers/HODs subscribe to live attendance of an offering they manage. */
  @SubscribeMessage('attendance.subscribe')
  async subscribeAttendance(@ConnectedSocket() socket: Socket, @MessageBody() body: { subjectOfferingId?: string }) {
    const p = this.principalOf(socket);
    if (!p?.collegeId || !body?.subjectOfferingId) return { ok: false };
    try {
      await this.access.assertManagesOffering(p, p.collegeId, body.subjectOfferingId);
    } catch {
      return { ok: false, error: 'forbidden' };
    }
    await socket.join(`offering:${body.subjectOfferingId}`);
    return { ok: true };
  }

  @OnEvent(REALTIME_EMIT)
  push(e: RealtimeEmit): void {
    if (e.userId) this.server.to(`user:${e.userId}`).emit(e.event, e.data);
    else if (e.room) this.server.to(e.room).emit(e.event, e.data);
  }
}
