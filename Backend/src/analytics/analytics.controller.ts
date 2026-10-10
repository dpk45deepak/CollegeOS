import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { AnalyticsService, scopeDepartments } from './analytics.service';
import { PerformanceService } from './performance.service';

class DaysQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days?: number;
}
class RiskQuery {
  @IsOptional() @IsIn(['MEDIUM', 'HIGH']) level?: 'MEDIUM' | 'HIGH';
}

@ApiTags('Analytics')
@ApiBearerAuth()
@RequirePermissions(P.ANALYTICS_VIEW)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly svc: AnalyticsService,
    private readonly perf: PerformanceService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'KPIs: students, attendance %, shortage, pass %, CGPA, assignment completion, fee collection, placement rate, complaint resolution time, scholarship participation',
    description: 'Admins: college-wide. HODs: their departments.',
  })
  overview(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.overview(t, scopeDepartments(u));
  }
  @Get('attention')
  @ApiOperation({ summary: '"What needs attention today?" — quantified, prioritised action items' })
  attention(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.attention(u, t);
  }
  @Get('attendance-trend') trend(@Tenant() t: string, @Query() q: DaysQuery) {
    return this.svc.attendanceTrend(t, q.days ?? 30);
  }
  @Get('departments') departments(@Tenant() t: string) {
    return this.svc.departmentBreakdown(t);
  }
  @Get('attendance-vs-performance')
  @ApiOperation({ summary: 'Correlation between attendance and marks (aggregate only)' })
  correlation(@Tenant() t: string) {
    return this.perf.attendanceVsPerformance(t);
  }
  @Get('risk')
  @ApiOperation({ summary: 'Students with elevated academic-risk indicators, with the reasons' })
  risk(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: RiskQuery) {
    return this.svc.riskList(u, t, q.level ?? 'HIGH');
  }
}
