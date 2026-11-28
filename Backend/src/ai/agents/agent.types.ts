import { Principal } from '../../common/types/principal';
import { ChatMessage } from '../providers/llm.provider';
import { Citation } from '../rag/prompt';

export type AgentName =
  | 'AcademicAssistantAgent'
  | 'AttendanceAdvisorAgent'
  | 'ScholarshipAgent'
  | 'PlacementAgent'
  | 'GrievanceAgent'
  | 'CollegeKnowledgeAgent';

export interface AgentInput {
  principal: Principal;
  collegeId: string;
  collegeName: string;
  message: string;
  history: ChatMessage[];
  conversationId?: string;
  studentId?: string;
  onToken?: (t: string) => void;
}
export interface ToolRun {
  tool: string;
  ok: boolean;
  summary?: string;
  data?: unknown;
}
export interface AgentResult {
  reply: string;
  agent: AgentName;
  citations: Citation[];
  /** Verbatim college data fetched by tools — shown separately from the model's prose. */
  collegeData: ToolRun[];
  mode: 'llm' | 'deterministic' | 'rag';
  pendingDraftId?: string;
}
export interface Agent {
  readonly name: AgentName;
  readonly description: string;
  run(input: AgentInput): Promise<AgentResult>;
}
