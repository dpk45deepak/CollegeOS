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

  @Get('executive')
  @RequirePermissions(P.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Institutional executive analytics (enrollment, CGPA distribution, placements, explainable insights)' })
  executive(@CurrentUser() u: Principal, @Tenant() t: string, @Query('departmentId') departmentId?: string) {
    return this.svc.executive(u, t, departmentId);
  }

  @Get('hod/department')
  @RequirePermissions(P.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Department analytics for HOD (faculty workload hours, subject pass rates, shortage)' })
  hodDepartment(@CurrentUser() u: Principal, @Tenant() t: string, @Query('departmentId') departmentId?: string) {
    return this.svc.hodDepartment(u, t, departmentId);
  }

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
  @Get('attendance-trend') trend(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: DaysQuery) {
    return this.svc.attendanceTrend(t, q.days ?? 30, scopeDepartments(u));
  }
  @Get('departments') departments(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.departmentBreakdown(t, scopeDepartments(u));
  }
  @Get('attendance-vs-performance')
  @ApiOperation({ summary: 'Correlation between attendance and marks (aggregate only)' })
  correlation(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.perf.attendanceVsPerformance(t, scopeDepartments(u));
  }
  @Get('risk')
  @ApiOperation({ summary: 'Students with elevated academic-risk indicators, with the reasons' })
  risk(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: RiskQuery) {
    return this.svc.riskList(u, t, q.level ?? 'HIGH');
  }
}
