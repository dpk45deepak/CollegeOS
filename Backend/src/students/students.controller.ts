import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import * as D from './dto/students.dto';
import { StudentsService } from './students.service';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly svc: StudentsService) {}

  @Get('me')
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  @ApiOperation({ summary: 'My full student profile' })
  me(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.me(u, t);
  }

  @Patch('me')
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  @ApiOperation({ summary: 'Update my phone / address (academic fields are admin-only)' })
  updateMe(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.UpdateMyProfileDto) {
    return this.svc.updateMe(u, t, dto);
  }

  @Post('me/skills')
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  addSkill(@CurrentUser() u: Principal, @Body() dto: D.AddSkillDto) {
    return this.svc.addSkill(u, dto);
  }
  @Delete('me/skills/:name')
  @HttpCode(204)
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  removeSkill(@CurrentUser() u: Principal, @Param('name') name: string) {
    return this.svc.removeSkill(u, name);
  }
  @Post('me/portfolio')
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  @ApiOperation({ summary: 'Add certification / project / achievement' })
  addPortfolio(@CurrentUser() u: Principal, @Body() dto: D.AddPortfolioItemDto) {
    return this.svc.addPortfolio(u, dto);
  }
  @Delete('me/portfolio/:id')
  @HttpCode(204)
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  removePortfolio(@CurrentUser() u: Principal, @Param('id') id: string) {
    return this.svc.removePortfolio(u, id);
  }

  @Get()
  @RequirePermissions(P.STUDENT_VIEW)
  @ApiOperation({
    summary: 'List students within my scope',
    description: 'Teachers only see students enrolled in their subjects; HODs their department.',
  })
  list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.StudentListQueryDto) {
    return this.svc.list(u, t, q);
  }

  @Post()
  @RequirePermissions(P.STUDENT_MANAGE)
  @ApiOperation({ summary: 'Onboard a student (creates login + profile + guardians)' })
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateStudentDto) {
    return this.svc.create(t, dto, u.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Student profile',
    description: 'Scope-checked: self, guardian, teacher of the student, HOD, or college-wide staff. 404 otherwise.',
  })
  get(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.get(u, t, id);
  }

  @Patch(':id')
  @RequirePermissions(P.STUDENT_MANAGE)
  update(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.UpdateStudentDto) {
    return this.svc.update(t, id, dto, u.userId);
  }
}
