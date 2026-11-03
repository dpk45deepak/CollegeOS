export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
  extra_content?: unknown;
  [key: string]: unknown;
}
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}
export interface ToolSpec {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}
export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolSpec[];
  temperature?: number;
  maxTokens?: number;
  /** Ask for a JSON object response (structured output). */
  json?: boolean;
  model?: string;
}
export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
}
export interface ChatResult {
  content: string | null;
  toolCalls: ToolCall[];
  usage: Usage;
  model: string;
}
export interface EmbedResult {
  vectors: number[][];
  model: string;
  usage: Usage;
}

/**
 * Provider-agnostic LLM contract. Business logic depends only on this interface, so swapping
 * OpenAI ↔ Gemini ↔ OpenRouter ↔ a local model is a configuration change.
 */
export interface LlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  chat(req: ChatRequest): Promise<ChatResult>;
  chatStream(req: ChatRequest, onToken: (t: string) => void): Promise<ChatResult>;
  embed(texts: string[], dimensions?: number): Promise<EmbedResult>;
}
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
