import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { ChatRequest, ChatResult, EmbedResult, LLM_PROVIDER, LlmProvider } from './providers/llm.provider';

export interface AiCallContext {
  collegeId: string;
  userId: string; // 'system' for background jobs
  conversationId?: string;
  retrievedChunkIds?: string[];
}

/**
 * The only way application code talks to an LLM. Adds observability (model, latency, tokens, tool names,
 * retrieved chunk ids, errors) without ever persisting prompts, answers or document text.
 */
@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);
  constructor(
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  get providerName() {
    return this.provider.name;
  }
  isConfigured() {
    return this.provider.isConfigured();
  }
  get embeddingDimensions() {
    return this.config.get('AI_EMBEDDING_DIMENSIONS');
  }

  async chat(ctx: AiCallContext, req: ChatRequest, onToken?: (t: string) => void): Promise<ChatResult> {
    return this.track(ctx, 'chat', async () => {
      const r = onToken ? await this.provider.chatStream(req, onToken) : await this.provider.chat(req);
      return { result: r, model: r.model, usage: r.usage, tools: r.toolCalls.map((t) => t.function.name) };
    });
  }

  async embed(ctx: AiCallContext, texts: string[]): Promise<EmbedResult> {
    return this.track(ctx, 'embedding', async () => {
      const r = await this.provider.embed(texts, this.embeddingDimensions);
      const bad = r.vectors.find((v) => v.length !== this.embeddingDimensions);
      if (bad)
        throw new Error(
          `Embedding model returned ${bad.length} dims but AI_EMBEDDING_DIMENSIONS=${this.embeddingDimensions} (vector column is fixed-size)`,
        );
      return { result: r, model: r.model, usage: r.usage, tools: [] as string[] };
    });
  }

  private async track<T>(
    ctx: AiCallContext,
    kind: string,
    fn: () => Promise<{
      result: T;
      model: string;
      usage: { promptTokens?: number; completionTokens?: number };
      tools: string[];
    }>,
  ): Promise<T> {
    const started = Date.now();
    try {
      const { result, model, usage, tools } = await fn();
      await this.log(ctx, kind, model, started, usage, tools);
      return result;
    } catch (e) {
      await this.log(ctx, kind, 'unknown', started, {}, [], (e as Error).message.slice(0, 300));
      throw e;
    }
  }

  private async log(
    ctx: AiCallContext,
    kind: string,
    model: string,
    started: number,
    usage: { promptTokens?: number; completionTokens?: number },
    tools: string[],
    error?: string,
  ) {
    try {
      await this.prisma.aiCallLog.create({
        data: {
          collegeId: ctx.collegeId,
          userId: ctx.userId,
          conversationId: ctx.conversationId,
          provider: this.provider.name,
          model,
          kind,
          latencyMs: Date.now() - started,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          retrievedChunkIds: ctx.retrievedChunkIds ?? [],
          toolCalls: tools.length ? tools : undefined,
          error,
        },
      });
    } catch (err) {
      this.logger.warn(`AiCallLog write failed: ${(err as Error).message}`);
    }
  }
}
