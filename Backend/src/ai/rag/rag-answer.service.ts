import { Injectable } from '@nestjs/common';
import { Principal } from '../../common/types/principal';
import { PrismaService } from '../../prisma/prisma.service';
import { AiClient } from '../ai-client.service';
import { ChatMessage } from '../providers/llm.provider';
import { INSUFFICIENT, NO_ANSWER_TEXT, buildRagMessages, resolveCitations, toCitation, Citation } from './prompt';
import { RetrievalFilters, RetrievalService } from './retrieval.service';

export interface KnowledgeAnswer {
  answer: string;
  grounded: boolean;
  citations: Citation[];
  mode: 'llm' | 'extractive' | 'no_answer';
}

@Injectable()
export class RagAnswerService {
  constructor(
    private readonly retrieval: RetrievalService,
    private readonly ai: AiClient,
    private readonly prisma: PrismaService,
  ) {}

  async answer(
    p: Principal,
    collegeId: string,
    question: string,
    opts: { history?: ChatMessage[]; conversationId?: string; filters?: RetrievalFilters } = {},
  ): Promise<KnowledgeAnswer> {
    const q = question.trim().slice(0, 1000);
    // For follow-ups ("and for BBA?") retrieve with the previous user turn as extra context.
    const lastUser = [...(opts.history ?? [])].reverse().find((m) => m.role === 'user')?.content;
    const retrievalQuery = lastUser && q.length < 60 ? `${lastUser} ${q}` : q;

    const r = await this.retrieval.retrieve(p, collegeId, retrievalQuery, opts.filters);
    if (!r.relevant) return { answer: NO_ANSWER_TEXT, grounded: false, citations: [], mode: 'no_answer' }; // LLM is never asked

    const ctx = {
      collegeId,
      userId: p.userId,
      conversationId: opts.conversationId,
      retrievedChunkIds: r.chunks.map((c) => c.id),
    };
    if (!this.ai.isConfigured()) {
      const top = r.chunks.slice(0, 3);
      return {
        answer: `AI summarisation is not configured. Most relevant passages:\n\n${top.map((c, i) => `[${i + 1}] ${c.content.slice(0, 500)}`).join('\n\n')}`,
        grounded: true,
        citations: top.map((c, i) => toCitation(c, i + 1)),
        mode: 'extractive',
      };
    }
    const college = await this.prisma.college.findUniqueOrThrow({ where: { id: collegeId }, select: { name: true } });
    const res = await this.ai.chat(ctx, {
      messages: buildRagMessages({
        collegeName: college.name,
        question: q,
        sources: r.chunks,
        history: opts.history?.slice(-6),
      }),
      temperature: 0.1,
      maxTokens: 700,
    });
    const raw = (res.content ?? '').trim();
    if (!raw || raw.startsWith(INSUFFICIENT))
      return { answer: NO_ANSWER_TEXT, grounded: false, citations: [], mode: 'no_answer' };
    const { text, citations } = resolveCitations(raw, r.chunks);
    return { answer: text, grounded: citations.length > 0, citations, mode: 'llm' };
  }
}
