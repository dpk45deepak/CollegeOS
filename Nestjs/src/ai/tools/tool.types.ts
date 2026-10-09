import { Principal } from '../../common/types/principal';

export interface ToolContext {
  principal: Principal;
  collegeId: string;
  conversationId?: string;
}
export interface ToolOutput {
  /** Verbatim college data returned to the model (and surfaced to the UI as "college data"). */
  data: unknown;
  /** One-line human summary for the UI. */
  summary: string;
  citations?: unknown[];
}
export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** Caller must hold at least one of these permissions. */
  anyOf: string[];
  execute(ctx: ToolContext, args: Record<string, unknown>): Promise<ToolOutput>;
}
/** Errors whose message is safe to show the model/user. Anything else becomes a generic failure. */
export class ToolError extends Error {}

export const str = (a: Record<string, unknown>, k: string, max = 2000): string | undefined =>
  typeof a[k] === 'string' && (a[k] as string).trim() ? (a[k] as string).trim().slice(0, max) : undefined;
export const int = (a: Record<string, unknown>, k: string, def: number, min: number, max: number): number => {
  const v = typeof a[k] === 'number' ? (a[k] as number) : Number(a[k]);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, Math.trunc(v))) : def;
};
export const obj = (properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
