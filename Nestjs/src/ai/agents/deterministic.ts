import { Injectable } from '@nestjs/common';
import { ToolRegistry } from '../tools/tool-registry';
import { Agent, AgentInput, AgentName, AgentResult, ToolRun } from './agent.types';

/** Default read-only tools per agent when no LLM is available (dev without API keys, or provider outage). */
const DEFAULTS: Partial<Record<AgentName, string[]>> = {
  AcademicAssistantAgent: ['getUpcomingExams', 'getAssignments', 'getAcademicPerformance'],
  AttendanceAdvisorAgent: ['getAttendance'],
  ScholarshipAgent: ['searchScholarships'],
  PlacementAgent: ['searchPlacementOpportunities'],
  GrievanceAgent: ['whoShouldIContact'],
};

@Injectable()
export class DeterministicResponder {
  constructor(private readonly registry: ToolRegistry) {}

  async respond(agent: Agent, i: AgentInput): Promise<AgentResult> {
    const runs: ToolRun[] = [];
    for (const name of DEFAULTS[agent.name] ?? []) {
      const args = name === 'whoShouldIContact' ? { problem: i.message } : {};
      const e = await this.registry.execute(name, JSON.stringify(args), {
        principal: i.principal,
        collegeId: i.collegeId,
        conversationId: i.conversationId,
      });
      runs.push({ tool: name, ok: e.ok, summary: e.summary, data: e.ok ? e.data : undefined });
    }
    const lines = runs.filter((r) => r.ok).map((r) => `• ${r.summary}`);
    const reply = lines.length
      ? `AI narration is currently unavailable, but here is what your college records show:\n${lines.join('\n')}`
      : 'The AI assistant is currently unavailable and I could not find matching records. Please try again shortly.';
    return { reply, agent: agent.name, citations: [], collegeData: runs, mode: 'deterministic' };
  }
}
