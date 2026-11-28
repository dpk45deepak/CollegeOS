import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch {
      throw new HealthCheckError('Database check failed', this.getStatus(key, false));
    }
  }
}

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }
  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { message: `Unexpected ping: ${pong}` }));
      }
      return this.getStatus(key, true);
    } catch (err) {
      if (err instanceof HealthCheckError) throw err;
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { message: 'Redis unreachable' }),
      );
    }
  }
}
