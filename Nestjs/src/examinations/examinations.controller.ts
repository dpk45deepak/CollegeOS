import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import * as D from './dto/exams.dto';
import { ExaminationsService } from './examinations.service';

@ApiTags('Examinations')
@ApiBearerAuth()
@Controller()
export class ExaminationsController {
  constructor(private readonly svc: ExaminationsService) {}

  @Post('exams')
  @RequirePermissions(P.EXAM_MANAGE)
  @ApiOperation({
    summary: 'Schedule an exam (internal / mid-sem / end-sem / practical / viva)',
    description: 'Detects section + room clashes; notifies enrolled students.',
  })
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateExamDto) {
    return this.svc.create(u, t, dto);
  }
  @Get('exams')
  @RequirePermissions(P.EXAM_VIEW)
  list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.ExamListQueryDto) {
    return this.svc.list(u, t, q);
  }
  @Post('exams/:id/cancel')
  @RequirePermissions(P.EXAM_MANAGE)
  cancel(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.cancel(u, t, id);
  }

  @Put('exams/:id/results')
  @RequirePermissions(P.RESULT_CREATE)
  @ApiOperation({
    summary: 'Enter / update marks (saved as DRAFT, grade auto-computed)',
    description: 'Changing already-published marks requires RESULT_UPDATE-level reason and is audited.',
  })
  enter(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.EnterResultsDto) {
    return this.svc.enterResults(u, t, id, dto);
  }
  @Get('exams/:id/results')
  @RequirePermissions(P.RESULT_CREATE)
  results(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.examResults(u, t, id);
  }
  @Post('exams/:id/publish')
  @RequirePermissions(P.RESULT_PUBLISH)
  @ApiOperation({ summary: 'Publish draft results', description: 'Recomputes CGPA, notifies students, audited.' })
  publish(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.publish(u, t, id);
  }

  @Get('grading-schemes') @RequirePermissions(P.EXAM_VIEW) schemes(@Tenant() t: string) {
    return this.svc.listSchemes(t);
  }
  @Post('grading-schemes')
  @RequirePermissions(P.EXAM_MANAGE)
  @ApiOperation({
    summary: 'Define a configurable grading scheme',
    description: 'Bands must cover 0–100 without gaps or overlaps.',
  })
  createScheme(@Tenant() t: string, @Body() dto: D.CreateGradingSchemeDto) {
    return this.svc.createScheme(t, dto);
  }
}
