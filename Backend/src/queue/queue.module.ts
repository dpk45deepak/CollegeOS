import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { ALL_QUEUES } from './queue.constants';

/**
 * All queues share one retry policy. Jobs that exhaust their attempts are kept
 * (removeOnFail: false) and act as the dead-letter set; Phase 9 adds a DLQ inspector/replay API.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const url = new URL(config.get('REDIS_URL'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password ? decodeURIComponent(url.password) : undefined,
            db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : 0,
            tls: url.protocol === 'rediss:' ? {} : undefined,
          },
          prefix: 'collegeos',
          defaultJobOptions: {
            attempts: 5,
            backoff: { type: 'exponential' as const, delay: 5_000 },
            removeOnComplete: { age: 3_600, count: 1_000 },
            removeOnFail: false,
          },
        };
      },
    }),
    ...ALL_QUEUES.map((name) => BullModule.registerQueue({ name })),
  ],
  exports: [BullModule],
})
export class QueueModule {}
