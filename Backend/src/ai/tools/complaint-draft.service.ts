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
    const raw = await this.redis.client.get(`cdraft:${userId}:${id}`);
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
    await this.redis.client.del(`cdraft:${p.userId}:${id}`);
    return complaint;
  }
  async cancel(userId: string, id: string) {
    await this.redis.client.del(`cdraft:${userId}:${id}`);
  }
}
