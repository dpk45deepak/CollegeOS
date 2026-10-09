import { Injectable } from '@nestjs/common';
import { PerformanceService } from '../../analytics/performance.service';
import { RiskService } from '../../analytics/risk.service';
import { AccessService } from '../../access/access.service';
import { P } from '../../auth/permissions';
import { AssignmentsService } from '../../assignments/assignments.service';
import { AttendanceAnalyticsService } from '../../attendance/attendance-analytics.service';
import { ExaminationsService } from '../../examinations/examinations.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { StudentsService } from '../../students/students.service';
import { TimetableService } from '../../timetable/timetable.service';
import { StudentResolver } from './student-resolver';
import { AiTool, ToolContext, int, obj, str } from './tool.types';

const sid = { studentId: { type: 'string', description: 'Staff/parents only. Students never need this.' } };
const mmss = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const page = (limit: number) => Object.assign(new PaginationQueryDto(), { page: 1, limit });

@Injectable()
export class StudentTools {
  constructor(
    private readonly students: StudentsService,
    private readonly attendance: AttendanceAnalyticsService,
    private readonly timetable: TimetableService,
    private readonly exams: ExaminationsService,
    private readonly assignments: AssignmentsService,
    private readonly perf: PerformanceService,
    private readonly risk: RiskService,
    private readonly resolver: StudentResolver,
    private readonly access: AccessService,
    private readonly prisma: PrismaService,
  ) {}

  tools(): AiTool[] {
    const own = [P.STUDENT_VIEW_OWN, P.STUDENT_VIEW];
    return [
      {
        name: 'getStudentProfile',
        description:
          'Profile of the student: name, program, department, batch, section, semester, roll number, CGPA, skills.',
        anyOf: own,
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const s = await this.students.get(ctx.principal, ctx.collegeId, id);
          return {
            summary: `Profile of ${s.user.firstName} ${s.user.lastName}`,
            data: {
              name: `${s.user.firstName} ${s.user.lastName}`,
              rollNumber: s.rollNumber,
              collegeId: s.collegeStudentId,
              department: s.department.name,
              program: s.program.name,
              batch: s.batch.name,
              section: s.section?.name,
              semester: s.semester?.number,
              cgpa: s.cgpa,
              skills: s.skills.map((k) => k.name),
            },
          };
        },
      },
      {
        name: 'getAttendance',
        description:
          'Attendance percentage per subject and overall, shortage status, how many more classes are needed to reach the minimum, and how many can still be missed.',
        anyOf: [P.ATTENDANCE_VIEW_OWN, P.ATTENDANCE_VIEW],
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const r = await this.attendance.report(ctx.collegeId, id);
          return { summary: `Overall attendance ${r.overall.percentage ?? 'n/a'}% (minimum ${r.threshold}%)`, data: r };
        },
      },
      {
        name: 'getTimetable',
        description: "Class timetable. scope='today' (default) or 'week'.",
        anyOf: [P.TIMETABLE_VIEW],
        parameters: obj({ ...sid, scope: { type: 'string', enum: ['today', 'week'] } }),
        execute: async (ctx, a) => {
          const slots =
            ctx.principal.teacherId && !ctx.principal.studentId
              ? await this.timetable.forTeacher(ctx.principal, ctx.collegeId)
              : await this.timetable.forStudent(ctx.collegeId, await this.resolver.resolve(ctx, str(a, 'studentId')));
          const college = await this.prisma.college.findUniqueOrThrow({
            where: { id: ctx.collegeId },
            select: { timezone: true },
          });
          const today = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: college.timezone })
            .format(new Date())
            .slice(0, 3)
            .toUpperCase();
          const week = str(a, 'scope') === 'week';
          const rows = slots
            .filter((s) => week || s.dayOfWeek === today)
            .map((s) => ({
              day: s.dayOfWeek,
              start: mmss(s.startMinute),
              end: mmss(s.endMinute),
              subject: s.subjectOffering.subject.name,
              room: s.room?.code ?? null,
            }));
          return {
            summary: week ? `${rows.length} weekly classes` : `${rows.length} class(es) today`,
            data: { today: DAYS.includes(today as never) ? today : null, classes: rows },
          };
        },
      },
      {
        name: 'getUpcomingExams',
        description: 'Exams scheduled in the next 60 days with dates, subjects and duration.',
        anyOf: [P.EXAM_VIEW],
        parameters: obj({ ...sid, withinDays: { type: 'integer', minimum: 1, maximum: 180 } }),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const list = await this.exams.upcomingForStudent(ctx.collegeId, id, int(a, 'withinDays', 60, 1, 180));
          const data = list.map((e) => ({
            subject: e.subjectOffering.subject.name,
            subjectId: e.subjectOffering.subject.id,
            title: e.title,
            type: e.type,
            date: e.scheduledAt.toISOString(),
            daysAway: Math.ceil((e.scheduledAt.getTime() - Date.now()) / 86_400_000),
            durationMinutes: e.durationMinutes,
            room: e.room?.code ?? null,
          }));
          return {
            summary: data.length ? `Next exam: ${data[0].subject} in ${data[0].daysAway} day(s)` : 'No upcoming exams',
            data,
          };
        },
      },
      {
        name: 'getAssignments',
        description:
          'Assignments with deadlines and submission status. pendingOnly=true lists only ones not yet submitted.',
        anyOf: [P.ASSIGNMENT_VIEW],
        parameters: obj({
          ...sid,
          dueWithinDays: { type: 'integer', minimum: 1, maximum: 60 },
          pendingOnly: { type: 'boolean' },
        }),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const q = Object.assign(page(30), { pending: a.pendingOnly === false ? undefined : 'true' });
          const res = await this.assignments.listForStudent(ctx.collegeId, id, q);
          const horizon = Date.now() + int(a, 'dueWithinDays', 14, 1, 60) * 86_400_000;
          const items = res.data
            .filter((x) => x.dueAt.getTime() <= horizon)
            .map((x) => ({
              title: x.title,
              subject: x.subjectOffering.subject.name,
              dueAt: x.dueAt.toISOString(),
              overdue: x.overdue,
              submitted: !!x.submission,
              status: x.submission?.status ?? 'NOT_SUBMITTED',
              marks: x.submission?.marks ?? null,
              maxMarks: x.maxMarks,
            }));
          return { summary: `${items.length} assignment(s) in range`, data: items };
        },
      },
      {
        name: 'getAcademicPerformance',
        description:
          'Marks by subject, trends, weak subjects (with reasons), assignment completion, attendance link, and an explainable academic risk indicator (an estimate, not a prediction).',
        anyOf: own,
        parameters: obj(sid),
        execute: async (ctx, a) => {
          const id = await this.resolver.resolve(ctx, str(a, 'studentId'));
          const [performance, risk] = await Promise.all([
            this.perf.forStudent(ctx.collegeId, id),
            this.risk.assess(ctx.collegeId, id, false),
          ]);
          return {
            summary: `Weak subjects: ${performance.weakSubjects.join(', ') || 'none detected'}; risk ${risk.level}`,
            data: {
              performance,
              risk: {
                level: risk.level,
                score: risk.score,
                reasons: risk.reasons,
                confidence: risk.confidence,
                disclaimer: risk.disclaimer,
              },
            },
          };
        },
      },
      {
        name: 'findStudents',
        description:
          'Staff only: find students in your scope by name / roll number. Returns ids to use with other tools.',
        anyOf: [P.STUDENT_VIEW],
        parameters: obj({ query: { type: 'string' } }, ['query']),
        execute: async (ctx, a) => {
          const q = str(a, 'query', 80);
          if (!q) return { summary: 'No query', data: [] };
          const res = await this.students.list(ctx.principal, ctx.collegeId, Object.assign(page(8), { search: q }));
          return {
            summary: `${res.data.length} match(es)`,
            data: res.data.map((s) => ({
              studentId: s.id,
              name: `${s.user.firstName} ${s.user.lastName}`,
              rollNumber: s.rollNumber,
              department: s.department.code,
              section: s.section?.name,
            })),
          };
        },
      },
    ];
  }
  // exported for tests
  readonly _ctxType?: ToolContext;
}
