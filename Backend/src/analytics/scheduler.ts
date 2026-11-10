import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Job, Queue } from 'bullmq';
import { AssignmentsService } from '../assignments/assignments.service';
import { AttendanceAnalyticsService } from '../attendance/attendance-analytics.service';
import { AppConfigService } from '../config/app-config.service';
import { AttendanceUpdatedEvent, DomainEvents } from '../common/events';
import { ComplaintsService } from '../complaints/complaints.service';
import { FeesService } from '../fees/fees.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUES } from '../queue/queue.constants';
import { ScholarshipsService } from '../scholarships/scholarships.service';
import { RiskService } from './risk.service';

const SCHEDULES: { id: string; pattern: string; job: string }[] = [
  { id: 'risk-recompute', pattern: '0 3 * * *', job: 'risk.recompute' },
  { id: 'attendance-scan', pattern: '0 6 * * *', job: 'attendance.scan' },
  { id: 'fees-due', pattern: '0 8 * * *', job: 'fees.due' },
  { id: 'scholarship-deadlines', pattern: '0 9 * * *', job: 'scholarship.deadlines' },
  { id: 'assignment-deadlines', pattern: '0 * * * *', job: 'assignment.deadlines' },
  { id: 'sla-sweep', pattern: '*/15 * * * *', job: 'sla.sweep' },
];
const BATCH = 200;
type JobData = { collegeId?: string; studentIds?: string[] };

/** Registers repeatable jobs (idempotent upsert — safe with many app instances) and reacts to domain events. */
@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  constructor(
    @InjectQueue(QUEUES.ANALYTICS) private readonly queue: Queue<JobData>,
    private readonly config: AppConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get('NODE_ENV') === 'test' || process.env.VERCEL) return;
    try {
      for (const s of SCHEDULES)
        await this.queue.upsertJobScheduler(s.id, { pattern: s.pattern }, { name: s.job, data: {} });
      this.logger.log(`Registered ${SCHEDULES.length} scheduled analytics jobs`);
    } catch (err: unknown) {
      this.logger.warn(`Could not register scheduled analytics jobs: ${(err as Error)?.message}`);
    }
  }

  /** StudentAttendanceUpdated → (debounced) analytics → shortage events → notifications; and risk refresh. */
  @OnEvent(DomainEvents.AttendanceUpdated)
  async onAttendance(e: AttendanceUpdatedEvent) {
    try {
      return await this.queue.add(
        'attendance.recompute',
        { collegeId: e.collegeId, studentIds: [...new Set(e.studentIds)] },
        { delay: 5_000 },
      );
    } catch (err) {
      this.logger.warn(`Attendance analytics queue offline: ${(err as Error)?.message}`);
    }
  }
}

@Processor(QUEUES.ANALYTICS, { concurrency: 2, autorun: !process.env.VERCEL })
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendance: AttendanceAnalyticsService,
    private readonly risk: RiskService,
    private readonly assignments: AssignmentsService,
    private readonly scholarships: ScholarshipsService,
    private readonly complaints: ComplaintsService,
    private readonly fees: FeesService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<unknown> {
    if (job.name === 'attendance.recompute') {
      const { collegeId, studentIds = [] } = job.data;
      if (!collegeId) return;
      const emitted = await this.attendance.scanAndEmit(collegeId, studentIds);
      await this.risk.assessMany(collegeId, studentIds);
      return { emitted };
    }
    const colleges = job.data.collegeId
      ? [{ id: job.data.collegeId }]
      : await this.prisma.college.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    const out: Record<string, unknown> = {};
    for (const { id } of colleges) {
      switch (job.name) {
        case 'attendance.scan':
          out[id] = await this.forAllStudents(id, (ids) => this.attendance.scanAndEmit(id, ids));
          break;
        case 'risk.recompute':
          out[id] = await this.forAllStudents(id, (ids) => this.risk.assessMany(id, ids));
          break;
        case 'assignment.deadlines':
          out[id] = await this.assignments.notifyApproachingDeadlines(id);
          break;
        case 'scholarship.deadlines':
          out[id] = await this.scholarships.notifyApproachingDeadlines(id);
          break;
        case 'sla.sweep':
          out[id] = await this.complaints.runSlaSweep(id);
          break;
        case 'fees.due':
          out[id] = await this.fees.notifyDue(id);
          break;
        default:
          this.logger.warn(`Unknown analytics job ${job.name}`);
      }
    }
    return out;
  }

  private async forAllStudents(collegeId: string, fn: (ids: string[]) => Promise<number>): Promise<number> {
    let cursor: string | undefined;
    let total = 0;
    for (;;) {
      const rows = await this.prisma.student.findMany({
        where: { collegeId },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: BATCH,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (!rows.length) return total;
      total += await fn(rows.map((r) => r.id));
      cursor = rows[rows.length - 1].id;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, err: Error) {
    this.logger.error(`analytics job ${job?.name} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  }
}
