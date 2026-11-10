import { InjectQueue } from '@nestjs/bullmq';
import { Controller, ForbiddenException, Get, HttpCode, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { ALL_QUEUES, QUEUES } from '../queue/queue.constants';

/** Platform operations (queues + dead-letter inspection). Queues are shared across tenants → SUPER_ADMIN only. */
@ApiTags('Admin')
@ApiBearerAuth()
@RequirePermissions(P.ORG_MANAGE)
@Controller('admin/queues')
export class AdminController {
  private readonly queues: Record<string, Queue>;
  constructor(
    @InjectQueue(QUEUES.EMAIL) q1: Queue,
    @InjectQueue(QUEUES.NOTIFICATION) q2: Queue,
    @InjectQueue(QUEUES.DOCUMENT_PROCESSING) q3: Queue,
    @InjectQueue(QUEUES.EMBEDDING) q4: Queue,
    @InjectQueue(QUEUES.ANALYTICS) q5: Queue,
    @InjectQueue(QUEUES.REPORT) q6: Queue,
  ) {
    this.queues = Object.fromEntries([q1, q2, q3, q4, q5, q6].map((q) => [q.name, q]));
  }

  private guard(p: Principal) {
    if (!p.isSuperAdmin) throw new ForbiddenException('Platform operators only');
  }
  private q(name: string) {
    const q = this.queues[name];
    if (!q) throw new NotFoundException(`Queue must be one of: ${ALL_QUEUES.join(', ')}`);
    return q;
  }

  @Get()
  @ApiOperation({ summary: 'Queue depths' })
  async stats(@CurrentUser() u: Principal) {
    this.guard(u);
    return Promise.all(
      Object.values(this.queues).map(async (q) => {
        try {
          const counts = await q.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
          return { queue: q.name, ...counts, status: 'ONLINE' };
        } catch {
          return {
            queue: q.name,
            waiting: 0,
            active: 0,
            delayed: 0,
            failed: 0,
            completed: 0,
            status: 'OFFLINE',
          };
        }
      }),
    );
  }
  @Get(':name/failed')
  @ApiOperation({ summary: 'Dead-letter set: jobs that exhausted all retries (payloads are not returned)' })
  async failed(@CurrentUser() u: Principal, @Param('name') name: string) {
    this.guard(u);
    try {
      const jobs = await this.q(name).getFailed(0, 49);
      return jobs.map((j) => ({
        id: j.id,
        name: j.name,
        attemptsMade: j.attemptsMade,
        failedReason: j.failedReason?.slice(0, 300),
        finishedOn: j.finishedOn,
      }));
    } catch {
      return [];
    }
  }
  @Post(':name/failed/:id/retry')
  @HttpCode(202)
  async retry(@CurrentUser() u: Principal, @Param('name') name: string, @Param('id') id: string) {
    this.guard(u);
    try {
      const job = await this.q(name).getJob(id);
      if (!job) throw new NotFoundException();
      await job.retry();
      return { retried: true };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      return { retried: false, reason: 'Queue backend offline' };
    }
  }
}
