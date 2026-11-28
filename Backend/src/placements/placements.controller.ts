import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import * as D from './dto/placements.dto';
import { PlacementsService } from './placements.service';

@ApiTags('Placements')
@ApiBearerAuth()
@Controller('placements')
export class PlacementsController {
  constructor(private readonly svc: PlacementsService) {}

  @Post('companies') @RequirePermissions(P.PLACEMENT_MANAGE) createCompany(
    @Tenant() t: string,
    @Body() d: D.CreateCompanyDto,
  ) {
    return this.svc.createCompany(t, d);
  }
  @Get('companies') @RequirePermissions(P.PLACEMENT_VIEW) companies(@Tenant() t: string) {
    return this.svc.listCompanies(t);
  }
  @Post('jobs') @RequirePermissions(P.PLACEMENT_MANAGE) createJob(@Tenant() t: string, @Body() d: D.CreateJobDto) {
    return this.svc.createJob(t, d);
  }
  @Get('jobs') @RequirePermissions(P.PLACEMENT_VIEW) jobs(@Tenant() t: string, @Query() q: D.JobQueryDto) {
    return this.svc.listJobs(t, q);
  }
  @Get('jobs/recommendations')
  @RequirePermissions(P.PLACEMENT_APPLY)
  @ApiOperation({
    summary: 'Jobs ranked by compatibility with my skills, projects and CGPA',
    description: 'Explainable: returns matched/missing skills. Sensitive attributes are never used.',
  })
  recs(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.recommendations(u, t);
  }
  @Post('jobs/:id/apply') @RequirePermissions(P.PLACEMENT_APPLY) apply(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.apply(u, t, id);
  }
  @Get('jobs/:id/applications') @RequirePermissions(P.PLACEMENT_MANAGE) forJob(
    @Tenant() t: string,
    @Param('id') id: string,
    @Query() q: D.JobQueryDto,
  ) {
    return this.svc.applicationsForJob(t, id, q);
  }

  @Post('drives') @RequirePermissions(P.PLACEMENT_MANAGE) createDrive(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Body() d: D.CreateDriveDto,
  ) {
    return this.svc.createDrive(t, d, u.userId);
  }
  @Get('drives') @RequirePermissions(P.PLACEMENT_VIEW) drives(@Tenant() t: string) {
    return this.svc.listDrives(t);
  }

  @Get('applications/mine') @RequirePermissions(P.PLACEMENT_APPLY) mine(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
  ) {
    return this.svc.myApplications(u, t);
  }
  @Patch('applications/:id/status') @RequirePermissions(P.PLACEMENT_MANAGE) status(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateApplicationDto,
  ) {
    return this.svc.updateStatus(t, id, d, u.userId);
  }
  @Post('applications/:id/interviews') @RequirePermissions(P.PLACEMENT_MANAGE) interview(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.ScheduleInterviewDto,
  ) {
    return this.svc.scheduleInterview(t, id, d);
  }
  @Post('applications/:id/offers') @RequirePermissions(P.PLACEMENT_MANAGE) offer(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.IssueOfferDto,
  ) {
    return this.svc.issueOffer(t, id, d, u.userId);
  }
  @Post('offers/:id/respond')
  @RequirePermissions(P.PLACEMENT_APPLY)
  @ApiOperation({ summary: 'Accept or decline an issued placement offer' })
  respondOffer(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.RespondOfferDto,
  ) {
    return this.svc.respondToOffer(u.studentId, t, id, dto.decision === 'ACCEPT', u.userId);
  }
  @Post('applications/:id/withdraw')
  @RequirePermissions(P.PLACEMENT_APPLY)
  @ApiOperation({ summary: 'Withdraw a job application before an offer is issued' })
  withdraw(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.withdrawApplication(u.studentId, t, id);
  }
}
