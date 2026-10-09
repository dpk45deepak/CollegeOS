import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/auth.decorators';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { DatabaseHealthIndicator, RedisHealthIndicator } from './health.indicators';

@ApiTags('Health')
@Public() // probes must work without credentials
@SkipEnvelope()
@SkipThrottle()
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DatabaseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe — process is up (no dependency checks)' })
  live() {
    return { status: 'ok', uptime: Math.round(process.uptime()) };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — PostgreSQL and Redis must be reachable' })
  ready() {
    return this.health.check([() => this.db.check('database'), () => this.redis.check('redis')]);
  }
}
