import { AgentName } from './agent.types';

interface Rule {
  agent: AgentName;
  patterns: [RegExp, number][];
}

const RULES: Rule[] = [
  {
    agent: 'GrievanceAgent',
    patterns: [
      [
        /complain|grievance|\bticket\b|harass|ragging|escalat|(not|hasn'?t|haven'?t|wasn'?t|isn'?t|didn'?t) (been |get |got )?(credited|received|disbursed)|who (handles|should i contact|do i contact|to contact)|whom (to|should i) (contact|ask|approach)|raise (an? )?(issue|concern)|(not|isn'?t|aren'?t) working|marked me absent|wrongly marked/i,
        3,
      ],
      [/\bissue|problem|report\b/i, 1],
    ],
  },
  {
    agent: 'CollegeKnowledgeAgent',
    patterns: [
      [
        /\b(rule|rules|policy|policies|regulation|regulations|handbook|circular|guideline|guidelines|criteria|bylaws?|code of conduct)\b/i,
        3,
      ],
      [/\b(explain|procedure|process|allowed|permitted|eligible to|mandatory|compulsory)\b/i, 1],
      [/\b(hostel|library|syllabus|dress code|leave policy)\b/i, 1],
    ],
  },
  {
    agent: 'ScholarshipAgent',
    patterns: [
      [/scholarship|stipend|fellowship|financial aid|fee waiver/i, 3],
      [/documents? (do i )?need|required documents/i, 1],
    ],
  },
  {
    agent: 'PlacementAgent',
    patterns: [
      [
        /placement|recruit|campus drive|internship|\bjobs?\b|job opening|interview|\bresume\b|\boffer letter\b|compan(y|ies)/i,
        3,
      ],
    ],
  },
  {
    agent: 'AttendanceAdvisorAgent',
    patterns: [
      [/attendance|\babsent\b|\bpresent\b|shortage|bunk|detain|miss(ed)? (a )?class|how many (more )?classes/i, 2],
    ],
  },
  {
    agent: 'AcademicAssistantAgent',
    patterns: [
      [
        /exam|marks|result|grade|cgpa|sgpa|assignment|timetable|schedule|class(es)? today|study|weak|subject|\bfees?\b|due|deadline|syllabus|performance|risk/i,
        2,
      ],
    ],
  },
];
// Higher index = lower priority when scores tie. Policy questions beat attendance questions ("explain the attendance rule").
const TIE_ORDER: AgentName[] = [
  'GrievanceAgent',
  'CollegeKnowledgeAgent',
  'ScholarshipAgent',
  'PlacementAgent',
  'AttendanceAdvisorAgent',
  'AcademicAssistantAgent',
];

export function classifyIntent(message: string): { agent: AgentName; score: number; confident: boolean } {
  const scored = RULES.map((r) => ({
    agent: r.agent,
    score: r.patterns.reduce((s, [re, w]) => s + (re.test(message) ? w : 0), 0),
  }));
  const best = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || TIE_ORDER.indexOf(a.agent) - TIE_ORDER.indexOf(b.agent))[0];
  if (!best) return { agent: 'AcademicAssistantAgent', score: 0, confident: false };
  return { agent: best.agent, score: best.score, confident: best.score >= 2 };
}
