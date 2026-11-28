import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import * as D from './dto/scholarships.dto';
import { ScholarshipsService } from './scholarships.service';

class DecisionDto {
  @IsIn(['APPROVED', 'REJECTED', 'DISBURSED']) status!: 'APPROVED' | 'REJECTED' | 'DISBURSED';
}

@ApiTags('Scholarships')
@ApiBearerAuth()
@Controller('scholarships')
export class ScholarshipsController {
  constructor(private readonly svc: ScholarshipsService) {}

  @Get() @RequirePermissions(P.SCHOLARSHIP_VIEW) list(@Tenant() t: string, @Query() q: D.ScholarshipQueryDto) {
    return this.svc.list(t, q);
  }
  @Get('matches')
  @RequirePermissions(P.SCHOLARSHIP_VIEW)
  @ApiOperation({ summary: 'Scholarships I may be eligible for, with met / unmet / to-verify criteria' })
  matches(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.matchesForStudent(u, t);
  }
  @Get(':id/applications')
  @RequirePermissions(P.SCHOLARSHIP_MANAGE)
  @ApiOperation({ summary: 'List applications for a scholarship (admin)' })
  applications(@Tenant() t: string, @Param('id') id: string) {
    return this.svc.listApplications(t, id);
  }

  @Get('applications/mine') @RequirePermissions(P.SCHOLARSHIP_VIEW) mine(@CurrentUser() u: Principal) {
    return this.svc.myApplications(u);
  }
  @Post(':id/interest') @RequirePermissions(P.SCHOLARSHIP_VIEW) interest(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.express(u, t, id, false);
  }
  @Post(':id/apply') @RequirePermissions(P.SCHOLARSHIP_VIEW) apply(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.express(u, t, id, true);
  }

  @Post() @RequirePermissions(P.SCHOLARSHIP_MANAGE) create(@Tenant() t: string, @Body() dto: D.CreateScholarshipDto) {
    return this.svc.create(t, dto);
  }
  @Patch(':id') @RequirePermissions(P.SCHOLARSHIP_MANAGE) update(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.UpdateScholarshipDto,
  ) {
    return this.svc.update(t, id, dto);
  }
  @Post(':id/applications/:studentId/decision')
  @RequirePermissions(P.SCHOLARSHIP_MANAGE)
  decide(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Param('studentId') sid: string,
    @Body() dto: DecisionDto,
  ) {
    return this.svc.decide(t, id, sid, dto.status, u.userId);
  }
}
