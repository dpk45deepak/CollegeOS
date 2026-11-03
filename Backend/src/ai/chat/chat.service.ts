import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto, paginate, toSkipTake } from '../../common/dto/pagination.dto';
import { Principal } from '../../common/types/principal';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AgentResult } from '../agents/agent.types';
import { Supervisor } from '../agents/supervisor';
import { ChatMessage } from '../providers/llm.provider';
import { ChatDto } from './dto/chat.dto';

const HISTORY_TURNS = 8;
const PER_MINUTE = 20;
export const AI_DISCLAIMER =
  'AI-generated. Figures come from your college records; suggestions are not official guidance.';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supervisor: Supervisor,
    private readonly redis: RedisService,
  ) {}

  async chat(p: Principal, collegeId: string, dto: ChatDto, onToken?: (t: string) => void) {
    await this.rateLimit(p.userId);
    const [college, conversation] = await Promise.all([
      this.prisma.college.findUniqueOrThrow({ where: { id: collegeId }, select: { name: true } }),
      this.conversation(p, collegeId, dto),
    ]);

    const past = await this.prisma.message.findMany({
      where: { conversationId: conversation.id, role: { in: ['USER', 'ASSISTANT'] } },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TURNS,
    });
    const history: ChatMessage[] = past
      .reverse()
      .map((m) => ({ role: m.role === 'USER' ? 'user' : 'assistant', content: m.content }));
    await this.prisma.message.create({
      data: { conversationId: conversation.id, senderId: p.userId, role: 'USER', content: dto.message },
    });

    const result: AgentResult = await this.supervisor.handle({
      principal: p,
      collegeId,
      collegeName: college.name,
      message: dto.message,
      history,
      conversationId: conversation.id,
      onToken,
    });

    // Persist the reply with lightweight metadata only — raw tool data (grades, fees…) is NOT stored in chat history.
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: result.reply,
        metadata: {
          agent: result.agent,
          mode: result.mode,
          citations: result.citations,
          tools: result.collegeData.map((c) => ({ tool: c.tool, ok: c.ok, summary: c.summary })),
        } as never,
      },
    });
    return {
      conversationId: conversation.id,
      reply: result.reply,
      agent: result.agent,
      mode: result.mode,
      citations: result.citations,
      collegeData: result.collegeData,
      pendingDraftId: result.pendingDraftId,
      disclaimer: AI_DISCLAIMER,
    };
  }

  private async conversation(p: Principal, collegeId: string, dto: ChatDto) {
    if (dto.conversationId) {
      const c = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, collegeId, type: 'AI_CHAT', createdById: p.userId },
      });
      if (!c) throw new NotFoundException('Conversation not found');
      return c;
    }
    return this.prisma.conversation.create({
      data: {
        collegeId,
        type: 'AI_CHAT',
        title: dto.message.slice(0, 60),
        createdById: p.userId,
        participants: { create: [{ userId: p.userId }] },
      },
    });
  }

  private async rateLimit(userId: string) {
    try {
      const key = `aichat:${userId}:${Math.floor(Date.now() / 60_000)}`;
      const n = await this.redis.client.incr(key);
      if (n === 1) await this.redis.client.expire(key, 90);
      if (n > PER_MINUTE)
        throw new HttpException(
          { message: 'Too many AI requests. Please wait a minute.', errorCode: 'AI_RATE_LIMITED' },
          429,
        );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      // Redis unavailable in serverless; bypass rate limiting
    }
  }

  async list(p: Principal, collegeId: string, q: PaginationQueryDto) {
    const where = { collegeId, type: 'AI_CHAT' as const, createdById: p.userId };
    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(q),
        select: { id: true, title: true, createdAt: true },
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  async messages(p: Principal, collegeId: string, id: string, q: PaginationQueryDto) {
    const c = await this.prisma.conversation.findFirst({
      where: { id, collegeId, type: 'AI_CHAT', createdById: p.userId },
    });
    if (!c) throw new NotFoundException('Conversation not found');
    const where = { conversationId: id };
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        ...toSkipTake(q),
        select: { id: true, role: true, content: true, metadata: true, createdAt: true },
      }),
      this.prisma.message.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  async remove(p: Principal, collegeId: string, id: string) {
    const r = await this.prisma.conversation.deleteMany({
      where: { id, collegeId, type: 'AI_CHAT', createdById: p.userId },
    });
    if (!r.count) throw new NotFoundException();
  }
}
