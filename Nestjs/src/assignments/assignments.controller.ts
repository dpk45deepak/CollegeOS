import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { AssignmentsService } from './assignments.service';
import * as D from './dto/assignments.dto';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly svc: AssignmentsService) {}

  @Post()
  @RequirePermissions(P.ASSIGNMENT_MANAGE)
  @ApiOperation({
    summary: 'Create an assignment (teacher of the offering)',
    description: 'Notifies every enrolled student.',
  })
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateAssignmentDto) {
    return this.svc.create(u, t, dto);
  }

  @Get()
  @RequirePermissions(P.ASSIGNMENT_VIEW)
  @ApiOperation({ summary: 'Assignments (students: enrolled subjects with submission status; staff: their offerings)' })
  list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.AssignmentListQueryDto) {
    return u.studentId ? this.svc.listForStudent(t, u.studentId, q) : this.svc.listForTeacher(u, t, q);
  }

  @Post(':id/submit')
  @RequirePermissions(P.ASSIGNMENT_SUBMIT)
  @ApiOperation({ summary: 'Submit (or re-submit until graded). Marked LATE after the deadline.' })
  submit(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.SubmitDto) {
    return this.svc.submit(u, t, id, dto);
  }

  @Get(':id/submissions')
  @RequirePermissions(P.ASSIGNMENT_MANAGE)
  submissions(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    return this.svc.submissions(u, t, id, q);
  }
  @Get(':id/missing')
  @RequirePermissions(P.ASSIGNMENT_MANAGE)
  @ApiOperation({ summary: 'Students who have not submitted' })
  missing(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.missing(u, t, id);
  }
  @Post('submissions/:submissionId/grade')
  @RequirePermissions(P.ASSIGNMENT_MANAGE)
  grade(@CurrentUser() u: Principal, @Tenant() t: string, @Param('submissionId') id: string, @Body() dto: D.GradeDto) {
    return this.svc.grade(u, t, id, dto);
  }
}
