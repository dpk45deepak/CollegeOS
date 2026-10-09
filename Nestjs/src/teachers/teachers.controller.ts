import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import * as D from './dto/teachers.dto';
import { TeachersService } from './teachers.service';

@ApiTags('Teachers')
@ApiBearerAuth()
@Controller()
export class TeachersController {
  constructor(private readonly svc: TeachersService) {}

  @Get('teachers/me') @RequirePermissions(P.TEACHER_VIEW) me(@CurrentUser() u: Principal) {
    return this.svc.me(u);
  }
  @Get('teachers')
  @RequirePermissions(P.TEACHER_VIEW)
  list(@Tenant() t: string, @Query() q: PaginationQueryDto, @Query('departmentId') d?: string) {
    return this.svc.list(t, q, d);
  }
  @Post('teachers')
  @RequirePermissions(P.TEACHER_MANAGE)
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateTeacherDto) {
    return this.svc.create(t, dto, u.userId);
  }

  @Get('subject-offerings')
  @RequirePermissions(P.ORG_VIEW)
  @ApiOperation({
    summary: 'Subject offerings in my scope',
    description: 'Teachers: their own. Students: ones they are enrolled in.',
  })
  offerings(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: PaginationQueryDto,
    @Query('sectionId') s?: string,
  ) {
    return this.svc.listOfferings(u, t, q, s);
  }
  @Post('subject-offerings')
  @RequirePermissions(P.ORG_MANAGE)
  @ApiOperation({ summary: 'Assign a teacher to teach a subject to a section' })
  createOffering(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateOfferingDto) {
    return this.svc.createOffering(t, dto, u.userId);
  }
  @Post('subject-offerings/:id/enrollments')
  @RequirePermissions(P.ORG_MANAGE)
  enroll(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.EnrollDto) {
    return this.svc.enroll(t, id, dto, u.userId);
  }
  @Get('subject-offerings/:id/students')
  @RequirePermissions(P.STUDENT_VIEW)
  roster(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.roster(u, t, id);
  }

  @Post('leave-requests')
  @RequirePermissions(P.LEAVE_REQUEST)
  leave(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.LeaveRequestDto) {
    return this.svc.requestLeave(u, t, dto);
  }
  @Post('leave-requests/:id/approve')
  @RequirePermissions(P.LEAVE_APPROVE)
  approve(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.reviewLeave(u, t, id, true);
  }
  @Post('leave-requests/:id/reject')
  @RequirePermissions(P.LEAVE_APPROVE)
  reject(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.reviewLeave(u, t, id, false);
  }
}
