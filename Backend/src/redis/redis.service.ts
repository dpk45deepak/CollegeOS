import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: AppConfigService) {
    this.client = new Redis(config.get('REDIS_URL'), {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: !!process.env.VERCEL,
      enableOfflineQueue: false,
    });
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  ping(): Promise<string> {
    return this.client.ping();
  }
  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
