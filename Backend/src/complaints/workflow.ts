import { ComplaintCategory, ComplaintStatus, Priority } from '@prisma/client';
import { ROLE } from '../auth/permissions';

/** Allowed status transitions. */
export const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  OPEN: ['ASSIGNED', 'ESCALATED', 'CLOSED'],
  ASSIGNED: ['INVESTIGATING', 'RESOLVED', 'AWAITING_FEEDBACK', 'ESCALATED'],
  INVESTIGATING: ['AWAITING_FEEDBACK', 'RESOLVED', 'ESCALATED', 'ASSIGNED'],
  ESCALATED: ['ASSIGNED', 'INVESTIGATING', 'RESOLVED', 'AWAITING_FEEDBACK'],
  RESOLVED: ['AWAITING_FEEDBACK', 'CLOSED', 'REOPENED'],
  AWAITING_FEEDBACK: ['RESOLVED', 'CLOSED', 'REOPENED'],
  CLOSED: [],
  REOPENED: ['ASSIGNED', 'INVESTIGATING', 'ESCALATED'],
};
export const canTransition = (from: ComplaintStatus, to: ComplaintStatus) => TRANSITIONS[from].includes(to);
export const isActive = (s: ComplaintStatus) => !['CLOSED', 'AWAITING_FEEDBACK', 'RESOLVED'].includes(s);

export const SLA_HOURS: Record<Priority, number> = { CRITICAL: 8, HIGH: 24, MEDIUM: 72, LOW: 120 };
export const slaDueAt = (priority: Priority, from = new Date()) =>
  new Date(from.getTime() + SLA_HOURS[priority] * 3_600_000);

export const bumpPriority = (p: Priority): Priority => (p === 'LOW' ? 'MEDIUM' : p === 'MEDIUM' ? 'HIGH' : 'CRITICAL');

export interface Routing {
  category: ComplaintCategory;
  /** Role that owns this kind of issue (resolved to a concrete user by the service). */
  handlerRole: string;
  /** True when the HOD of the student's department should own it. */
  departmental: boolean;
  priority: Priority;
  confidence: number;
  rationale: string;
}

const RULES: { category: ComplaintCategory; words: RegExp; role: string; departmental?: boolean }[] = [
  {
    category: 'SCHOLARSHIP',
    words: /scholarship|stipend|fellowship|not (been )?credited|disburse/i,
    role: ROLE.ACCOUNTANT,
  },
  {
    category: 'FEES',
    words: /\bfees?\b|payment|receipt|refund|challan|due amount|transaction/i,
    role: ROLE.ACCOUNTANT,
  },
  {
    category: 'EXAMINATION',
    words: /exam|result|marks|revaluation|re-?evaluation|hall ticket|admit card|grade card|backlog/i,
    role: ROLE.EXAM_CONTROLLER,
  },
  {
    category: 'ATTENDANCE',
    words: /attendance|marked (me )?(as )?absent|shortage|proxy/i,
    role: ROLE.HOD,
    departmental: true,
  },
  {
    category: 'FACULTY',
    words: /teacher|professor|faculty|lecturer|sir\b|madam|ma'?am|misbehav|teaching/i,
    role: ROLE.HOD,
    departmental: true,
  },
  { category: 'HOSTEL', words: /hostel|warden|mess|room (allot|clean)|laundry/i, role: ROLE.SUPPORT_STAFF },
  { category: 'TRANSPORT', words: /bus|transport|route|driver/i, role: ROLE.SUPPORT_STAFF },
  {
    category: 'IT',
    words: /wifi|wi-fi|internet|portal|login|password|lab computer|erp|server|email id/i,
    role: ROLE.SUPPORT_STAFF,
  },
  {
    category: 'INFRASTRUCTURE',
    words: /classroom|projector|fan|ac\b|water|toilet|washroom|library|bench|electric|lights?\b|broken/i,
    role: ROLE.SUPPORT_STAFF,
  },
  {
    category: 'ACADEMIC',
    words: /syllabus|curriculum|subject|timetable|class schedule|assignment|lab manual|course/i,
    role: ROLE.HOD,
    departmental: true,
  },
];
const SENSITIVE = /rag(ging)?|harass|abuse|assault|threat|bully|discriminat|stalk|molest|suicid|self[- ]harm/i;
const URGENT = /urgent|immediately|tomorrow|today|deadline|emergency|asap/i;

/**
 * Transparent keyword router: the always-available fallback and the guard-rail for the AI router.
 * Sensitive reports (ragging, harassment…) are always CRITICAL and go to a college admin, never to a department.
 */
export function classifyComplaint(text: string, hint?: ComplaintCategory): Routing {
  if (SENSITIVE.test(text)) {
    return {
      category: hint ?? 'OTHER',
      handlerRole: ROLE.COLLEGE_ADMIN,
      departmental: false,
      priority: 'CRITICAL',
      confidence: 0.95,
      rationale: 'Sensitive safety/conduct keywords — routed to college administration at highest priority',
    };
  }
  const priority: Priority = URGENT.test(text) ? 'HIGH' : 'MEDIUM';
  const rule = hint ? RULES.find((r) => r.category === hint) : RULES.find((r) => r.words.test(text));
  if (!rule)
    return {
      category: hint ?? 'OTHER',
      handlerRole: ROLE.COLLEGE_ADMIN,
      departmental: false,
      priority,
      confidence: 0.3,
      rationale: 'No clear category — routed to college administration',
    };
  return {
    category: rule.category,
    handlerRole: rule.role,
    departmental: !!rule.departmental,
    priority,
    confidence: hint ? 0.9 : 0.7,
    rationale: `Matched ${rule.category.toLowerCase()} keywords → ${rule.role.toLowerCase().replace('_', ' ')}`,
  };
}
