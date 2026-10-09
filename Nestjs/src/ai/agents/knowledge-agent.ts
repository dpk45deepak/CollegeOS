import { Injectable } from '@nestjs/common';
import { Agent, AgentInput, AgentResult } from './agent.types';
import { RagAnswerService } from '../rag/rag-answer.service';

/** RAG-first agent: answers only from permission-filtered college documents, with citations. */
@Injectable()
export class CollegeKnowledgeAgent implements Agent {
  readonly name = 'CollegeKnowledgeAgent' as const;
  readonly description = 'College rules, policies, regulations, handbook, circulars (cited)';
  constructor(private readonly rag: RagAnswerService) {}

  async run(i: AgentInput): Promise<AgentResult> {
    const r = await this.rag.answer(i.principal, i.collegeId, i.message, {
      history: i.history,
      conversationId: i.conversationId,
    });
    return { reply: r.answer, agent: this.name, citations: r.citations, collegeData: [], mode: 'rag' };
  }
}
