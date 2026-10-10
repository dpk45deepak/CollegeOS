import { Injectable, Logger } from '@nestjs/common';
import { Principal } from '../../common/types/principal';
import { ToolSpec } from '../providers/llm.provider';
import { CampusTools } from './campus-tools';
import { StudentTools } from './student-tools';
import { AiTool, ToolContext, ToolError, ToolOutput } from './tool.types';

const MAX_RESULT_CHARS = 6000;
export interface ToolExecution {
  name: string;
  ok: boolean;
  content: string;
  summary?: string;
  data?: unknown;
  citations?: unknown[];
}

/**
 * The only bridge between an LLM and college data:  LLM → Tool → Service → DB.
 * Every execution re-checks the caller's permissions, so a manipulated model cannot reach beyond what the
 * signed-in user could do through the normal API.
 */
@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private readonly tools: Map<string, AiTool>;

  constructor(student: StudentTools, campus: CampusTools) {
    this.tools = new Map([...student.tools(), ...campus.tools()].map((t) => [t.name, t]));
  }

  allowed(p: Principal, t: AiTool): boolean {
    return t.anyOf.some((perm) => p.permissions.includes(perm));
  }

  names(): string[] {
    return [...this.tools.keys()];
  }

  specsFor(p: Principal, only?: string[]): ToolSpec[] {
    return [...this.tools.values()]
      .filter((t) => (!only || only.includes(t.name)) && this.allowed(p, t))
      .map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
  }

  async execute(name: string, rawArgs: string, ctx: ToolContext, only?: string[]): Promise<ToolExecution> {
    const tool = this.tools.get(name);
    if (!tool || (only && !only.includes(name))) return this.fail(name, 'Unknown tool.');
    if (!this.allowed(ctx.principal, tool)) {
      this.logger.warn(`tool ${name} denied for user ${ctx.principal.userId}`);
      return this.fail(name, 'You do not have permission to use this tool.');
    }
    let args: Record<string, unknown> = {};
    try {
      args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
      if (typeof args !== 'object' || args === null || Array.isArray(args)) throw new Error();
    } catch {
      return this.fail(name, 'Tool arguments were not valid JSON.');
    }
    try {
      const out: ToolOutput = await tool.execute(ctx, args);
      let content = JSON.stringify({ ok: true, data: out.data, citations: out.citations });
      if (content.length > MAX_RESULT_CHARS) content = `${content.slice(0, MAX_RESULT_CHARS)}…[truncated]`;
      return { name, ok: true, content, summary: out.summary, data: out.data, citations: out.citations };
    } catch (e) {
      if (e instanceof ToolError) return this.fail(name, e.message);
      const status = (e as { status?: number }).status;
      if (status === 403 || status === 404) return this.fail(name, 'Not found or not accessible.');
      this.logger.error({ err: e }, `tool ${name} failed`);
      return this.fail(name, 'The tool failed. Tell the user the data is temporarily unavailable.');
    }
  }
  private fail(name: string, message: string): ToolExecution {
    return { name, ok: false, content: JSON.stringify({ ok: false, error: message }), summary: message };
  }
}
