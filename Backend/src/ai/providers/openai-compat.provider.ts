import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { AiProviderName } from '../../config/env.validation';
import { ChatRequest, ChatResult, EmbedResult, LlmProvider, ToolCall } from './llm.provider';

export interface CompatOptions {
  name: AiProviderName;
  baseUrl: string;
  apiKey?: string;
  chatModel: string;
  embeddingModel: string;
  requiresKey: boolean;
  extraHeaders?: Record<string, string>;
}

/** Defaults per provider. Gemini and OpenRouter both expose OpenAI-compatible endpoints; "local" = Ollama / LM Studio / vLLM. */
export const PROVIDER_DEFAULTS: Record<
  AiProviderName,
  { baseUrl: string; chatModel: string; embeddingModel: string; requiresKey: boolean }
> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    requiresKey: true,
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    chatModel: 'gemini-2.0-flash',
    embeddingModel: 'text-embedding-004',
    requiresKey: true,
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    chatModel: 'openai/gpt-4o-mini',
    embeddingModel: 'openai/text-embedding-3-small',
    requiresKey: true,
  },
  local: {
    baseUrl: 'http://localhost:11434/v1',
    chatModel: 'llama3.1',
    embeddingModel: 'nomic-embed-text',
    requiresKey: false,
  },
};

interface WireChatResponse {
  model?: string;
  choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenAiCompatProvider implements LlmProvider {
  private readonly logger = new Logger('LlmProvider');
  constructor(private readonly o: CompatOptions) {}
  get name() {
    return this.o.name;
  }
  isConfigured(): boolean {
    return !this.o.requiresKey || !!this.o.apiKey;
  }

  private async post<T>(path: string, body: unknown, stream = false): Promise<Response | T> {
    if (!this.isConfigured())
      throw new ServiceUnavailableException({
        message: `AI provider "${this.o.name}" is not configured`,
        errorCode: 'AI_NOT_CONFIGURED',
      });
    const headers: Record<string, string> = { 'content-type': 'application/json', ...this.o.extraHeaders };
    if (this.o.apiKey) headers.authorization = `Bearer ${this.o.apiKey}`;
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(`${this.o.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.ok) return stream ? res : ((await res.json()) as T);
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }
      const text = (await res.text()).slice(0, 300);
      this.logger.warn(`LLM ${path} failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException({
        message: 'The AI service is temporarily unavailable',
        errorCode: 'AI_UPSTREAM_ERROR',
      });
    }
  }

  private payload(req: ChatRequest, stream: boolean) {
    return {
      model: req.model ?? this.o.chatModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.2,
      max_tokens: req.maxTokens,
      ...(req.tools?.length ? { tools: req.tools, tool_choice: 'auto' } : {}),
      ...(req.json ? { response_format: { type: 'json_object' } } : {}),
      ...(stream ? { stream: true } : {}),
    };
  }

  async chat(req: ChatRequest): Promise<ChatResult> {
    const r = (await this.post<WireChatResponse>('/chat/completions', this.payload(req, false))) as WireChatResponse;
    const msg = r.choices?.[0]?.message;
    return {
      content: msg?.content ?? null,
      toolCalls: msg?.tool_calls ?? [],
      usage: { promptTokens: r.usage?.prompt_tokens, completionTokens: r.usage?.completion_tokens },
      model: r.model ?? this.o.chatModel,
    };
  }

  async chatStream(req: ChatRequest, onToken: (t: string) => void): Promise<ChatResult> {
    const res = (await this.post('/chat/completions', this.payload(req, true), true)) as Response;
    const reader = res.body?.getReader();
    if (!reader) throw new ServiceUnavailableException('No stream body');
    const decoder = new TextDecoder();
    let buf = '';
    let content = '';
    let model = this.o.chatModel;
    const calls = new Map<number, ToolCall>();
    const usage: ChatResult['usage'] = {};
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data) as {
            model?: string;
            usage?: { prompt_tokens?: number; completion_tokens?: number };
            choices?: {
              delta?: {
                content?: string;
                tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
              };
            }[];
          };
          if (j.model) model = j.model;
          if (j.usage) {
            usage.promptTokens = j.usage.prompt_tokens;
            usage.completionTokens = j.usage.completion_tokens;
          }
          const d = j.choices?.[0]?.delta;
          if (d?.content) {
            content += d.content;
            onToken(d.content);
          }
          for (const tc of d?.tool_calls ?? []) {
            const cur = calls.get(tc.index) ?? {
              id: tc.id ?? `call_${tc.index}`,
              type: 'function' as const,
              function: { name: '', arguments: '' },
            };
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.function.name += tc.function.name;
            if (tc.function?.arguments) cur.function.arguments += tc.function.arguments;
            calls.set(tc.index, cur);
          }
        } catch {
          /* ignore malformed keep-alive chunks */
        }
      }
    }
    return { content: content || null, toolCalls: [...calls.values()], usage, model };
  }

  async embed(texts: string[], dimensions?: number): Promise<EmbedResult> {
    const body: Record<string, unknown> = { model: this.o.embeddingModel, input: texts };
    if (dimensions && this.o.name === 'openai') body.dimensions = dimensions;
    const r = (await this.post<{
      data: { embedding: number[]; index: number }[];
      model?: string;
      usage?: { prompt_tokens?: number };
    }>('/embeddings', body)) as {
      data: { embedding: number[]; index: number }[];
      model?: string;
      usage?: { prompt_tokens?: number };
    };
    const vectors = [...r.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
    return { vectors, model: r.model ?? this.o.embeddingModel, usage: { promptTokens: r.usage?.prompt_tokens } };
  }
}
