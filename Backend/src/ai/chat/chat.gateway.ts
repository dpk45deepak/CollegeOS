import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';
import { P } from '../../auth/permissions';
import { SocketData } from '../../realtime/realtime.gateway';
import { ChatService } from './chat.service';

/** Streaming AI replies over the authenticated `/realtime` namespace: emit `ai.chat`, receive `ai.token`* then `ai.done`. */
@WebSocketGateway({ namespace: '/realtime' })
export class AiChatGateway {
  private readonly logger = new Logger(AiChatGateway.name);
  constructor(private readonly chat: ChatService) {}

  @SubscribeMessage('ai.chat')
  async onChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { message?: string; conversationId?: string; studentId?: string; requestId?: string },
  ) {
    const p = (socket.data as SocketData).principal;
    const requestId = body?.requestId ?? 'r';
    if (!p?.collegeId || !p.permissions.includes(P.AI_CHAT)) {
      socket.emit('ai.error', { requestId, message: 'Forbidden' });
      return;
    }
    if (typeof body?.message !== 'string' || body.message.length < 1 || body.message.length > 2000) {
      socket.emit('ai.error', { requestId, message: 'Invalid message' });
      return;
    }
    try {
      const result = await this.chat.chat(
        p,
        p.collegeId,
        { message: body.message, conversationId: body.conversationId, studentId: body.studentId },
        (token) => socket.emit('ai.token', { requestId, token }),
      );
      socket.emit('ai.done', { requestId, ...result });
    } catch (e) {
      this.logger.warn(`ai.chat failed: ${(e as Error).message}`);
      socket.emit('ai.error', {
        requestId,
        message: (e as { status?: number }).status === 429 ? 'Rate limited' : 'The assistant is unavailable right now',
      });
    }
  }
}
