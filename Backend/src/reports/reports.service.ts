import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { Job, Queue } from 'bullmq';
import { AccessService } from '../access/access.service';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { NOTIFY } from '../common/events';
import { Principal } from '../common/types/principal';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES } from '../queue/queue.constants';
import { StorageService } from '../storage/storage.service';
import { PerformanceService } from '../analytics/performance.service';
import { ReportRenderer, csvRenderer } from './csv';

export const REPORT_TYPES = ['attendance', 'performance', 'fees', 'placements', 'complaints', 'scholarships'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
const MAX_ROWS = 50_000;
export interface ReportData {
  title: string;
  columns: string[];
  rows: unknown[][];
}
interface ReportJob {
  collegeId: string;
  type: ReportType;
  principal: Principal;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly attendance: AttendanceAnalyticsService,
    private readonly perf: PerformanceService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2,
    @InjectQueue(QUEUES.REPORT) private readonly queue: Queue<ReportJob>,
  ) {}

  renderer: ReportRenderer = csvRenderer;

  assertType(t: string): ReportType {
    if (!(REPORT_TYPES as readonly string[]).includes(t))
      throw new BadRequestException(`Unknown report. Available: ${REPORT_TYPES.join(', ')}`);
    return t as ReportType;
  }

  async build(p: Principal, c: string, type: ReportType): Promise<ReportData> {
    switch (type) {
      case 'attendance':
        return this.attendanceReport(p, c);
      case 'performance':
        return this.performanceReport(p, c);
      case 'fees':
        return this.feeReport(p, c);
      case 'placements':
        return this.placementReport(c);
      case 'complaints':
        return this.complaintReport(c);
      case 'scholarships':
        return this.scholarshipReport(c);
    }
  }

  private async attendanceReport(p: Principal, c: string): Promise<ReportData> {
    const students = await this.prisma.student.findMany({
      where: this.access.studentWhere(p, c),
      select: {
        id: true,
        rollNumber: true,
        collegeStudentId: true,
        user: { select: { firstName: true, lastName: true } },
        department: { select: { code: true } },
        section: { select: { name: true } },
      },
      orderBy: { rollNumber: 'asc' },
      take: MAX_ROWS,
    });
    const reports = new Map<string, Awaited<ReturnType<AttendanceAnalyticsService['report']>>>();
    for (let i = 0; i < students.length; i += 500)
      for (const [k, v] of await this.attendance.reports(
        c,
        students.slice(i, i + 500).map((s) => s.id),
      ))
        reports.set(k, v);
    return {
      title: 'Attendance report',
      columns: [
        'College ID',
        'Roll',
        'Name',
        'Department',
        'Section',
        'Attended',
        'Total',
        'Percentage',
        'Status',
        'Classes needed to reach minimum',
      ],
      rows: students.map((s) => {
        const o = reports.get(s.id)!.overall;
        return [
          s.collegeStudentId,
          s.rollNumber,
          `${s.user.firstName} ${s.user.lastName}`,
          s.department.code,
          s.section?.name ?? '',
          o.attended,
          o.total,
          o.percentage,
          o.health,
          o.classesNeeded,
        ];
      }),
    };
  }
  private async performanceReport(p: Principal, c: string): Promise<ReportData> {
    const students = await this.prisma.student.findMany({
      where: this.access.studentWhere(p, c),
      select: {
        id: true,
        rollNumber: true,
        cgpa: true,
        user: { select: { firstName: true, lastName: true } },
        department: { select: { code: true } },
        academicRiskAssessments: { orderBy: { computedAt: 'desc' }, take: 1, select: { level: true, score: true } },
      },
      orderBy: { rollNumber: 'asc' },
      take: 5000,
    });
    const rows: unknown[][] = [];
    for (const s of students) {
      const perf = await this.perf.forStudent(c, s.id);
      rows.push([
        s.rollNumber,
        `${s.user.firstName} ${s.user.lastName}`,
        s.department.code,
        s.cgpa === null ? '' : Number(s.cgpa),
        perf.examAvgPct,
        perf.weakSubjects.join('; '),
        s.academicRiskAssessments[0]?.level ?? '',
      ]);
    }
    return {
      title: 'Student performance report',
      columns: ['Roll', 'Name', 'Department', 'CGPA', 'Exam average %', 'Weak subjects', 'Risk indicator (estimate)'],
      rows,
    };
  }
  private async feeReport(p: Principal, c: string): Promise<ReportData> {
    const fees = await this.prisma.studentFee.findMany({
      where: { collegeId: c, student: this.access.studentWhere(p, c) },
      include: {
        student: { select: { rollNumber: true, user: { select: { firstName: true, lastName: true } } } },
        feeStructure: { select: { name: true, academicYear: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: MAX_ROWS,
    });
    return {
      title: 'Fee report',
      columns: ['Roll', 'Name', 'Fee', 'Year', 'Due', 'Discount', 'Scholarship adj.', 'Paid', 'Due date', 'Status'],
      rows: fees.map((f) => [
        f.student.rollNumber,
        `${f.student.user.firstName} ${f.student.user.lastName}`,
        f.feeStructure.name,
        f.feeStructure.academicYear,
        Number(f.amountDue),
        Number(f.discount),
        Number(f.scholarshipAdjustment),
        Number(f.amountPaid),
        f.dueDate,
        f.status,
      ]),
    };
  }
  private async placementReport(c: string): Promise<ReportData> {
    const apps = await this.prisma.jobApplication.findMany({
      where: { collegeId: c },
      include: {
        job: { select: { title: true, company: { select: { name: true } } } },
        student: { select: { rollNumber: true, cgpa: true, user: { select: { firstName: true, lastName: true } } } },
        offers: { select: { ctc: true } },
      },
      take: MAX_ROWS,
      orderBy: { createdAt: 'desc' },
    });
    return {
      title: 'Placement report',
      columns: ['Roll', 'Name', 'CGPA', 'Company', 'Role', 'Status', 'Match score', 'Offer CTC'],
      rows: apps.map((a) => [
        a.student.rollNumber,
        `${a.student.user.firstName} ${a.student.user.lastName}`,
        a.student.cgpa === null ? '' : Number(a.student.cgpa),
        a.job.company.name,
        a.job.title,
        a.status,
        a.matchScore === null ? '' : Number(a.matchScore),
        a.offers[0] ? Number(a.offers[0].ctc) : '',
      ]),
    };
  }
  private async complaintReport(c: string): Promise<ReportData> {
    const rows = await this.prisma.complaint.findMany({
      where: { collegeId: c },
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS,
    });
    return {
      title: 'Complaint report',
      columns: [
        'Ticket',
        'Category',
        'Priority',
        'Status',
        'Escalation level',
        'Created',
        'Resolved',
        'Resolution hours',
        'Rating',
        'SLA breached',
      ],
      rows: rows.map((r) => [
        r.ticketNo,
        r.category,
        r.priority,
        r.status,
        r.escalationLevel,
        r.createdAt,
        r.resolvedAt ?? '',
        r.resolvedAt ? Math.round(((r.resolvedAt.getTime() - r.createdAt.getTime()) / 3_600_000) * 10) / 10 : '',
        r.feedbackRating ?? '',
        r.slaDueAt && (r.resolvedAt ?? new Date()) > r.slaDueAt ? 'YES' : 'NO',
      ]),
    };
  }
  private async scholarshipReport(c: string): Promise<ReportData> {
    const rows = await this.prisma.scholarship.findMany({
      where: { collegeId: c },
      include: { applications: { select: { status: true } } },
    });
    const count = (s: { status: string }[], st: string[]) => s.filter((x) => st.includes(x.status)).length;
    return {
      title: 'Scholarship report',
      columns: [
        'Scholarship',
        'Type',
        'Provider',
        'Deadline',
        'Interested',
        'Applied',
        'Approved/Disbursed',
        'Rejected',
      ],
      rows: rows.map((s) => [
        s.name,
        s.type,
        s.provider,
        s.deadline ?? '',
        count(s.applications, ['INTERESTED']),
        count(s.applications, ['APPLIED']),
        count(s.applications, ['APPROVED', 'DISBURSED']),
        count(s.applications, ['REJECTED']),
      ]),
    };
  }

  async csv(p: Principal, c: string, type: ReportType) {
    const d = await this.build(p, c, type);
    return {
      filename: `${type}-${new Date().toISOString().slice(0, 10)}.${this.renderer.extension}`,
      contentType: this.renderer.contentType,
      body: this.renderer.render(d.title, d.columns, d.rows),
    };
  }

  /** Large exports run in the reportQueue, land in object storage and notify the requester. */
  async enqueue(p: Principal, c: string, type: ReportType) {
    try {
      const job = await this.queue.add('generate', { collegeId: c, type, principal: p });
      return { jobId: job.id, status: 'QUEUED' };
    } catch {
      // In serverless or when queue is offline, execute export synchronously
      await this.store({ collegeId: c, type, principal: p });
      return { jobId: `sync_${Date.now()}`, status: 'COMPLETED' };
    }
  }
  async file(p: Principal, c: string, key: string) {
    if (!key.startsWith(`${c}/reports/${p.userId}/`)) throw new NotFoundException('Report not found'); // own reports only
    return {
      body: await this.storage.read(key).catch(() => {
        throw new NotFoundException('Report not found');
      }),
      contentType: this.renderer.contentType,
      filename: key.split('/').pop() ?? 'report.csv',
    };
  }
  async store(job: ReportJob) {
    const data = await this.build(job.principal, job.collegeId, job.type);
    const key = `${job.collegeId}/reports/${job.principal.userId}/${job.type}-${Date.now()}.${this.renderer.extension}`;
    await this.storage.putRaw(
      key,
      this.renderer.render(data.title, data.columns, data.rows),
      this.renderer.contentType,
    );
    this.events.emit(NOTIFY, {
      collegeId: job.collegeId,
      userIds: [job.principal.userId],
      type: 'ReportReady',
      title: `${data.title} is ready`,
      body: 'Your export has finished.',
      data: { fileKey: key },
    });
    return key;
  }
}

@Processor(QUEUES.REPORT, { autorun: !process.env.VERCEL })
export class ReportProcessor extends WorkerHost {
  constructor(private readonly reports: ReportsService) {
    super();
  }
  process(job: Job<ReportJob>) {
    return this.reports.store(job.data);
  }
}
export type { Prisma };
