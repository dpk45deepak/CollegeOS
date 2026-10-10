import { Injectable } from '@nestjs/common';
import { AiClient } from '../ai-client.service';
import { ChatMessage } from '../providers/llm.provider';
import { Citation } from '../rag/prompt';
import { ToolRegistry } from '../tools/tool-registry';
import { ToolContext } from '../tools/tool.types';
import { ToolRun } from './agent.types';

const MAX_ITERATIONS = 4;
const MAX_CALLS_PER_STEP = 4;

export interface LoopResult {
  reply: string;
  runs: ToolRun[];
  citations: Citation[];
  draftId?: string;
}

/** Generic function-calling loop: model asks for tools → backend executes (permission-checked) → model answers. */
@Injectable()
export class ToolLoop {
  constructor(
    private readonly ai: AiClient,
    private readonly registry: ToolRegistry,
  ) {}

  async run(
    ctx: ToolContext & { conversationId?: string },
    opts: { system: string; history: ChatMessage[]; user: string; toolNames: string[]; onToken?: (t: string) => void },
  ): Promise<LoopResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: opts.system },
      ...opts.history,
      { role: 'user', content: opts.user },
    ];
    const specs = this.registry.specsFor(ctx.principal, opts.toolNames);
    const runs: ToolRun[] = [];
    const citations: Citation[] = [];
    let draftId: string | undefined;
    const call = { collegeId: ctx.collegeId, userId: ctx.principal.userId, conversationId: ctx.conversationId };

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const last = i === MAX_ITERATIONS - 1;
      const res = await this.ai.chat(
        call,
        { messages, tools: last || !specs.length ? undefined : specs, temperature: 0.2, maxTokens: 800 },
        opts.onToken,
      );
      if (!res.toolCalls.length) return { reply: (res.content ?? '').trim(), runs, citations, draftId };
      messages.push({ role: 'assistant', content: res.content, tool_calls: res.toolCalls });
      for (const tc of res.toolCalls.slice(0, MAX_CALLS_PER_STEP)) {
        const exec = await this.registry.execute(tc.function.name, tc.function.arguments, ctx, opts.toolNames);
        runs.push({ tool: exec.name, ok: exec.ok, summary: exec.summary, data: exec.ok ? exec.data : undefined });
        if (exec.citations) citations.push(...(exec.citations as Citation[]));
        const d = exec.data as { draftId?: string } | undefined;
        if (exec.ok && d?.draftId) draftId = d.draftId;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: exec.content });
      }
    }
    return { reply: 'I could not complete that request. Please try rephrasing.', runs, citations, draftId };
  }
}
