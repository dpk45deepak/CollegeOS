import { Injectable } from '@nestjs/common';
import { ComplaintCategory } from '@prisma/client';
import { P } from '../../auth/permissions';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ComplaintsService } from '../../complaints/complaints.service';
import { classifyComplaint } from '../../complaints/workflow';
import { FeesService } from '../../fees/fees.service';
import { PlacementsService } from '../../placements/placements.service';
import { ScholarshipsService } from '../../scholarships/scholarships.service';
import { RagAnswerService } from '../rag/rag-answer.service';
import { ComplaintDraftService } from './complaint-draft.service';
import { missingDetails } from './complaint-draft';
import { StudentResolver } from './student-resolver';
import { AiTool, ToolError, obj, str } from './tool.types';

const sid = { studentId: { type: 'string', description: 'Parents/staff only.' } };
const CATEGORIES = Object.values(ComplaintCategory);

@Injectable()
export class CampusTools {
  constructor(
    private readonly fees: FeesService,
    private readonly scholarships: ScholarshipsService,
    private readonly placements: PlacementsService,
    private readonly complaints: ComplaintsService,
    private readonly drafts: ComplaintDraftService,
    private readonly rag: RagAnswerService,
    private readonly resolver: StudentResolver,
  ) {}

  tools(): AiTool[] {
    return [
      {
        name: 'getFees',
        description: 'Fee records: amount due, discounts, paid, outstanding, due dates, status.',
        anyOf: [P.FEE_VIEW_OWN, P.FEE_VIEW_ALL],
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const rows = await this.fees.forStudent(ctx.collegeId, id);
          const data = rows.map((f) => ({
            name: f.feeStructure.name,
            academicYear: f.feeStructure.academicYear,
            netPayable: f.netPayable,
            paid: Number(f.amountPaid),
            outstanding: f.outstanding,
            dueDate: f.dueDate.toISOString().slice(0, 10),
            status: f.computedStatus,
          }));
          return { summary: `₹${data.reduce((s, d) => s + d.outstanding, 0)} outstanding`, data };
        },
      },
      {
        name: 'searchCollegeDocuments',
        description:
          'Search official college documents (rules, regulations, policies, circulars, syllabus, handbook) and get a sourced answer. Use for ANY question about college rules or policies. Only documents the user may access are searched.',
        anyOf: [P.AI_CHAT],
        parameters: obj({ question: { type: 'string' } }, ['question']),
        execute: async (ctx, a) => {
          const q = str(a, 'question', 1000);
          if (!q) throw new ToolError('question is required');
          const r = await this.rag.answer(ctx.principal, ctx.collegeId, q, { conversationId: ctx.conversationId });
          return {
            summary: r.grounded ? `Found ${r.citations.length} source(s)` : 'No matching policy found',
            data: { answer: r.answer, grounded: r.grounded },
            citations: r.citations,
          };
        },
      },
      {
        name: 'searchScholarships',
        description:
          'Open scholarships the student may be eligible for, with met / unmet / to-verify criteria, deadlines and required documents.',
        anyOf: [P.SCHOLARSHIP_VIEW],
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const rows = await this.scholarships.matchesForStudent({ ...ctx.principal, studentId: id }, ctx.collegeId);
          const data = rows.slice(0, 10).map(({ scholarship, match }) => {
            const s = scholarship as {
              name: string;
              provider: string;
              type: string;
              deadline: Date | null;
              amount: unknown;
              requiredDocuments: string[];
            };
            return {
              name: s.name,
              provider: s.provider,
              type: s.type,
              deadline: s.deadline?.toISOString().slice(0, 10) ?? null,
              amount: s.amount,
              requiredDocuments: s.requiredDocuments,
              fit: match.fit,
              met: match.met,
              toVerify: match.toVerify,
            };
          });
          return { summary: `${data.length} possible scholarship(s)`, data };
        },
      },
      {
        name: 'searchPlacementOpportunities',
        description:
          'Open jobs ranked by compatibility with the student’s skills, projects and CGPA, with matched/missing skills.',
        anyOf: [P.PLACEMENT_VIEW, P.PLACEMENT_APPLY],
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const rows = await this.placements.recommendations({ ...ctx.principal, studentId: id }, ctx.collegeId);
          const data = rows
            .slice(0, 8)
            .map(({ job, match }) => ({
              jobId: job.id,
              company: job.company.name,
              title: job.title,
              deadline: job.deadline?.toISOString().slice(0, 10) ?? null,
              eligible: match.eligible,
              compatibility: match.score,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              notEligibleBecause: match.ineligibleReasons,
            }));
          return { summary: `${data.length} opportunity(ies)`, data };
        },
      },
      {
        name: 'getComplaintStatus',
        description: 'Status of the user’s complaints (optionally one ticket).',
        anyOf: [P.COMPLAINT_VIEW_OWN],
        parameters: obj({ ticketNo: { type: 'string' } }),
        execute: async (ctx, a) => {
          const res = await this.complaints.mine(
            ctx.principal,
            ctx.collegeId,
            Object.assign(new PaginationQueryDto(), { page: 1, limit: 10 }),
          );
          const t = str(a, 'ticketNo', 30)?.toUpperCase();
          const data = res.data
            .filter((c) => !t || c.ticketNo === t)
            .map((c) => ({
              ticketNo: c.ticketNo,
              subject: c.subject,
              status: c.status,
              priority: c.priority,
              category: c.category,
              slaDueAt: c.slaDueAt?.toISOString() ?? null,
              escalationLevel: c.escalationLevel,
            }));
          return { summary: `${data.length} complaint(s)`, data };
        },
      },
      {
        name: 'whoShouldIContact',
        description:
          'Given a problem description, return the category, responsible desk, priority and assignee WITHOUT filing anything.',
        anyOf: [P.COMPLAINT_CREATE],
        parameters: obj({ problem: { type: 'string' } }, ['problem']),
        execute: async (ctx, a) => {
          const text = str(a, 'problem');
          if (!text) throw new ToolError('problem is required');
          const r = await this.complaints.previewRoute(ctx.principal, ctx.collegeId, text);
          return { summary: `${r.category} → ${r.handlerRole}`, data: r };
        },
      },
      {
        name: 'createComplaintDraft',
        description:
          'Prepare (NOT submit) a complaint draft from what the user described. If key details are missing it returns questions to ask the user first. The user must confirm in the app before anything is submitted.',
        anyOf: [P.COMPLAINT_CREATE],
        parameters: obj(
          {
            subject: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: CATEGORIES },
          },
          ['subject', 'description'],
        ),
        execute: async (ctx, a) => {
          const subject = str(a, 'subject', 160),
            description = str(a, 'description', 5000);
          if (!subject || !description) throw new ToolError('subject and description are required');
          const hint = CATEGORIES.find((c) => c === a.category);
          const routing = classifyComplaint(`${subject}\n${description}`, hint);
          const questions = missingDetails(`${subject} ${description}`, hint ?? routing.category);
          if (questions.length)
            return { summary: 'More details needed', data: { status: 'NEEDS_MORE_INFO', questions } };
          const draftId = await this.drafts.save(ctx.principal.userId, ctx.collegeId, {
            subject,
            description,
            category: hint ?? routing.category,
            routing,
          });
          return {
            summary: 'Draft ready — awaiting user confirmation',
            data: {
              status: 'DRAFT_READY',
              draftId,
              category: routing.category,
              priority: routing.priority,
              routedTo: routing.handlerRole,
              rationale: routing.rationale,
              note: 'Nothing has been submitted. Ask the user to confirm; they must press Confirm in the app.',
            },
          };
        },
      },
    ];
  }
}
