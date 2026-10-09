import { Injectable, Logger } from '@nestjs/common';
import { AiClient } from '../ai-client.service';
import {
  AcademicAssistantAgent,
  AttendanceAdvisorAgent,
  GrievanceAgent,
  PlacementAgent,
  ScholarshipAgent,
} from './tool-agent';
import { Agent, AgentInput, AgentName, AgentResult } from './agent.types';
import { DeterministicResponder } from './deterministic';
import { classifyIntent } from './intent-router';
import { CollegeKnowledgeAgent } from './knowledge-agent';

/**
 * Supervisor / router:  user query → intent detection → agent selection → (tool execution | RAG) → final response.
 * Intent detection is rule-based first (free, deterministic, testable); the LLM only breaks ties on unclear queries.
 */
@Injectable()
export class Supervisor {
  private readonly logger = new Logger(Supervisor.name);
  private readonly agents: Map<AgentName, Agent>;

  constructor(
    private readonly ai: AiClient,
    private readonly fallback: DeterministicResponder,
    academic: AcademicAssistantAgent,
    attendance: AttendanceAdvisorAgent,
    scholarship: ScholarshipAgent,
    placement: PlacementAgent,
    grievance: GrievanceAgent,
    knowledge: CollegeKnowledgeAgent,
  ) {
    this.agents = new Map<AgentName, Agent>(
      [academic, attendance, scholarship, placement, grievance, knowledge].map((a) => [a.name, a]),
    );
  }

  agentList() {
    return [...this.agents.values()].map((a) => ({ name: a.name, description: a.description }));
  }

  async route(i: AgentInput): Promise<AgentName> {
    const r = classifyIntent(i.message);
    if (r.confident || !this.ai.isConfigured()) return r.agent;
    try {
      const res = await this.ai.chat(
        { collegeId: i.collegeId, userId: i.principal.userId, conversationId: i.conversationId },
        {
          json: true,
          temperature: 0,
          maxTokens: 40,
          messages: [
            {
              role: 'system',
              content: `Classify the student's message into exactly one agent. Reply as JSON {"agent": "<name>"}.\n${this.agentList()
                .map((a) => `${a.name}: ${a.description}`)
                .join('\n')}`,
            },
            { role: 'user', content: i.message.slice(0, 500) },
          ],
        },
      );
      const name = (JSON.parse(res.content ?? '{}') as { agent?: string }).agent as AgentName | undefined;
      if (name && this.agents.has(name)) return name;
    } catch (e) {
      this.logger.debug(`LLM intent fallback failed: ${(e as Error).message}`);
    }
    return r.agent;
  }

  async handle(i: AgentInput): Promise<AgentResult> {
    const name = await this.route(i);
    const agent = this.agents.get(name)!;
    // Knowledge agent has its own no-LLM extractive mode; others degrade to deterministic tool summaries.
    if (!this.ai.isConfigured() && name !== 'CollegeKnowledgeAgent') return this.fallback.respond(agent, i);
    try {
      return await agent.run(i);
    } catch (e) {
      this.logger.warn(`agent ${name} failed: ${(e as Error).message}`);
      if (name === 'CollegeKnowledgeAgent') throw e;
      return this.fallback.respond(agent, i);
    }
  }
}
