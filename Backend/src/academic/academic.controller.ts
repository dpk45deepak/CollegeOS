import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { AcademicService } from './academic.service';
import * as D from './dto/academic.dto';

@ApiTags('Organisation')
@ApiBearerAuth()
@Controller()
export class OrgController {
  constructor(private readonly svc: AcademicService) {}

  @Post('colleges')
  @RequirePermissions(P.ORG_MANAGE)
  @ApiOperation({ summary: 'Create a college (tenant) + its admin', description: 'SUPER_ADMIN only' })
  createCollege(@CurrentUser() u: Principal, @Body() dto: D.CreateCollegeDto) {
    return this.svc.createCollege(u, dto);
  }
  @Get('colleges')
  @RequirePermissions(P.ORG_MANAGE)
  @ApiOperation({ summary: 'List all colleges', description: 'SUPER_ADMIN only' })
  colleges(@CurrentUser() u: Principal) {
    return this.svc.listColleges(u);
  }
  @Get('colleges/current')
  @ApiOperation({ summary: 'My college + settings' })
  current(@Tenant() t: string) {
    return this.svc.currentCollege(t);
  }
  @Patch('colleges/current/settings')
  @RequirePermissions(P.ORG_MANAGE)
  @ApiOperation({ summary: 'Update attendance mode / threshold / timezone', description: 'Audited' })
  settings(@Tenant() t: string, @CurrentUser() u: Principal, @Body() dto: D.UpdateCollegeSettingsDto) {
    return this.svc.updateSettings(t, dto, u.userId);
  }

  @Get('campuses') @RequirePermissions(P.ORG_VIEW) listCampuses(@Tenant() t: string) {
    return this.svc.listCampuses(t);
  }
  @Post('campuses') @RequirePermissions(P.ORG_MANAGE) createCampus(@Tenant() t: string, @Body() d: D.CreateCampusDto) {
    return this.svc.createCampus(t, d);
  }
  @Patch('campuses/:id') @RequirePermissions(P.ORG_MANAGE) updateCampus(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateCampusDto,
  ) {
    return this.svc.updateCampus(t, id, d);
  }

  @Get('departments') @RequirePermissions(P.ORG_VIEW) listDepartments(@Tenant() t: string) {
    return this.svc.listDepartments(t);
  }
  @Post('departments') @RequirePermissions(P.ORG_MANAGE) createDepartment(
    @Tenant() t: string,
    @Body() d: D.CreateDepartmentDto,
  ) {
    return this.svc.createDepartment(t, d);
  }
  @Patch('departments/:id') @RequirePermissions(P.ORG_MANAGE) updateDepartment(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateDepartmentDto,
  ) {
    return this.svc.updateDepartment(t, id, d);
  }

  @Get('programs') @RequirePermissions(P.ORG_VIEW) listPrograms(@Tenant() t: string) {
    return this.svc.listPrograms(t);
  }
  @Post('programs') @RequirePermissions(P.ORG_MANAGE) createProgram(
    @Tenant() t: string,
    @Body() d: D.CreateProgramDto,
  ) {
    return this.svc.createProgram(t, d);
  }
  @Patch('programs/:id') @RequirePermissions(P.ORG_MANAGE) updateProgram(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateProgramDto,
  ) {
    return this.svc.updateProgram(t, id, d);
  }
}

@ApiTags('Organisation')
@ApiBearerAuth()
@Controller()
export class BatchController {
  constructor(private readonly svc: AcademicService) {}
  @Get('batches') @RequirePermissions(P.ORG_VIEW) batches(
    @Tenant() t: string,
    @Query('departmentId') dep?: string,
    @Query('programId') prog?: string,
  ) {
    return this.svc.listBatches(t, dep, prog);
  }
  @Post('batches') @RequirePermissions(P.ORG_MANAGE) createBatch(@Tenant() t: string, @Body() d: D.CreateBatchDto) {
    return this.svc.createBatch(t, d);
  }
  @Get('semesters') @RequirePermissions(P.ORG_VIEW) semesters(@Tenant() t: string, @Query('batchId') b?: string) {
    return this.svc.listSemesters(t, b);
  }
  @Post('semesters') @RequirePermissions(P.ORG_MANAGE) createSemester(
    @Tenant() t: string,
    @Body() d: D.CreateSemesterDto,
  ) {
    return this.svc.createSemester(t, d);
  }
  @Patch('semesters/:id') @RequirePermissions(P.ORG_MANAGE) updateSemester(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateSemesterDto,
  ) {
    return this.svc.updateSemester(t, id, d);
  }
  @Get('sections') @RequirePermissions(P.ORG_VIEW) sections(@Tenant() t: string, @Query('semesterId') s?: string) {
    return this.svc.listSections(t, s);
  }
  @Post('sections') @RequirePermissions(P.ORG_MANAGE) createSection(
    @Tenant() t: string,
    @Body() d: D.CreateSectionDto,
  ) {
    return this.svc.createSection(t, d);
  }
  @Patch('sections/:id') @RequirePermissions(P.ORG_MANAGE) updateSection(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateSectionDto,
  ) {
    return this.svc.updateSection(t, id, d);
  }
}

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectController {
  constructor(private readonly svc: AcademicService) {}
  @Get()
  @RequirePermissions(P.ORG_VIEW)
  list(
    @Tenant() t: string,
    @Query() q: PaginationQueryDto,
    @Query('departmentId') dep?: string,
    @Query('search') s?: string,
  ) {
    return this.svc.listSubjects(t, q, dep, s);
  }
  @Post() @RequirePermissions(P.ORG_MANAGE) create(@Tenant() t: string, @Body() d: D.CreateSubjectDto) {
    return this.svc.createSubject(t, d);
  }
  @Patch(':id') @RequirePermissions(P.ORG_MANAGE) update(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateSubjectDto,
  ) {
    return this.svc.updateSubject(t, id, d);
  }
}
