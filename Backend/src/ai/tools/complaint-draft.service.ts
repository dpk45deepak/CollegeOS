import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintCategory } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { ComplaintsService } from '../../complaints/complaints.service';
import { Routing } from '../../complaints/workflow';
import { Principal } from '../../common/types/principal';
import { RedisService } from '../../redis/redis.service';

export interface ComplaintDraft {
  subject: string;
  description: string;
  category: ComplaintCategory;
  routing: Routing;
  createdBy: string;
  collegeId: string;
}
const TTL = 30 * 60;

/**
 * Two-step grievance filing. The AI may only create a DRAFT; nothing reaches the grievance desk until the
 * signed-in user explicitly confirms through the REST endpoint (never through the model).
 */
@Injectable()
export class ComplaintDraftService {
  private readonly draftFallback = new Map<string, { data: string; expiresAt: number }>();
  constructor(
    private readonly redis: RedisService,
    private readonly complaints: ComplaintsService,
  ) {}

  async save(userId: string, collegeId: string, d: Omit<ComplaintDraft, 'createdBy' | 'collegeId'>): Promise<string> {
    const id = randomBytes(9).toString('base64url');
    await this.redis.client.set(
      `cdraft:${userId}:${id}`,
      JSON.stringify({ ...d, createdBy: userId, collegeId }),
      'EX',
      TTL,
    );
    return id;
  }
  async get(userId: string, id: string): Promise<ComplaintDraft> {
    let raw: string | null = null;
    try {
      raw = await this.redis.client.get(`cdraft:${userId}:${id}`);
    } catch {
      const item = this.draftFallback.get(`cdraft:${userId}:${id}`);
      if (item && item.expiresAt > Date.now()) raw = item.data;
    }
    if (!raw) throw new NotFoundException('Draft expired or not found');
    return JSON.parse(raw) as ComplaintDraft;
  }
  async confirm(p: Principal, collegeId: string, id: string) {
    const d = await this.get(p.userId, id);
    if (d.collegeId !== collegeId) throw new NotFoundException('Draft expired or not found');
    const complaint = await this.complaints.create(
      p,
      collegeId,
      { category: d.category, subject: d.subject, description: d.description },
      { routing: d.routing, routedByAi: true },
    );
    try { await this.redis.client.del(`cdraft:${p.userId}:${id}`); } catch { this.draftFallback.delete(`cdraft:${p.userId}:${id}`); }
    return complaint;
  }
  async cancel(userId: string, id: string) {
    try { await this.redis.client.del(`cdraft:${userId}:${id}`); } catch { this.draftFallback.delete(`cdraft:${userId}:${id}`); }
  }
}
