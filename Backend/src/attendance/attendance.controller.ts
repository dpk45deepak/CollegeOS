import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';
import { AccessService } from '../access/access.service';
import { P } from '../auth/permissions';
import { CurrentUser, RequireAnyPermission, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { AttendanceAnalyticsService } from './attendance-analytics.service';
import { AttendanceService } from './attendance.service';
import * as D from './dto/attendance.dto';

class SessionQueryDto {
  @IsString() subjectOfferingId!: string;
  @Type(() => Date) @IsDate() date!: Date;
}

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly svc: AttendanceService,
    private readonly analytics: AttendanceAnalyticsService,
    private readonly access: AccessService,
  ) {}

  @Post()
  @RequirePermissions(P.ATTENDANCE_MARK)
  @ApiOperation({
    summary: 'Mark attendance (individual, bulk or whole-section)',
    description:
      'Teacher of the offering (or admin). Records already marked are skipped, never overwritten — use the correction workflow. Mode (PER_LECTURE/DAILY/CUSTOM) comes from the college settings.',
  })
  mark(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.MarkAttendanceDto) {
    return this.svc.mark(u, t, dto);
  }

  @Get('teacher/scheduled-sessions')
  @RequirePermissions(P.ATTENDANCE_MARK)
  @ApiOperation({ summary: "Teacher's timetable scheduled sessions for a date" })
  scheduledSessions(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.ScheduledSessionsQueryDto) {
    return this.svc.getTeacherScheduledSessions(u, t, q.date);
  }

  @Get('scheduled-sessions/:slotId/roster')
  @RequirePermissions(P.ATTENDANCE_MARK)
  @ApiOperation({ summary: 'Student roster for a scheduled timetable session on a date' })
  sessionRoster(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('slotId') slotId: string,
    @Query() q: D.SessionRosterQueryDto,
  ) {
    return this.svc.getScheduledSessionRoster(u, t, slotId, q.date);
  }

  @Get('register')
  @RequirePermissions(P.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Monthly section attendance register matrix for a subject offering' })
  register(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.SectionRegisterQueryDto) {
    return this.svc.getSectionRegister(u, t, q.subjectOfferingId, q.month, q.year);
  }

  @Get('sessions')
  @RequirePermissions(P.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Attendance sessions + records for an offering on a date' })
  sessions(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: SessionQueryDto) {
    return this.svc.getSession(u, t, q.subjectOfferingId, q.date);
  }

  @Post('correction-request')
  @RequirePermissions(P.ATTENDANCE_CORRECT_REQUEST)
  @ApiOperation({
    summary: 'Request a correction to a marked record',
    description: 'Goes to the department HOD / admin. Original data is preserved until approved.',
  })
  requestCorrection(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CorrectionRequestDto) {
    return this.svc.requestCorrection(u, t, dto);
  }

  @Get('corrections')
  @RequireAnyPermission(P.ATTENDANCE_VIEW, P.ATTENDANCE_VIEW_OWN)
  @ApiOperation({ summary: "Corrections: own (student), assigned/requested (teacher), or department/college (HOD/admin)" })
  corrections(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.CorrectionListQueryDto) {
    return this.svc.listCorrections(u, t, q);
  }

  @Post('corrections/:id/review')
  @RequirePermissions(P.ATTENDANCE_CORRECT_APPROVE)
  @ApiOperation({
    summary: 'Approve / reject a correction',
    description: 'Transactional; writes an audit log with old/new value and reason. Requester cannot self-approve.',
  })
  review(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.ReviewCorrectionDto,
  ) {
    return this.svc.reviewCorrection(u, t, id, dto);
  }

  @Get('corrections/:id')
  @RequireAnyPermission(P.ATTENDANCE_VIEW, P.ATTENDANCE_VIEW_OWN)
  @ApiOperation({ summary: 'Get details of an attendance correction request' })
  correctionDetail(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.getCorrectionDetail(u, t, id);
  }

  @Get('students/:studentId/report')
  @RequirePermissions(P.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Per-subject attendance + shortage math + intelligence flags for one student' })
  async report(@CurrentUser() u: Principal, @Tenant() t: string, @Param('studentId') id: string) {
    await this.access.assertStudent(u, t, id);
    return this.analytics.report(t, id);
  }

  @Get('students/:studentId/records')
  @RequirePermissions(P.ATTENDANCE_VIEW)
  async records(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('studentId') id: string,
    @Query() q: D.AttendanceQueryDto,
  ) {
    await this.access.assertStudent(u, t, id);
    return this.svc.studentRecords(t, id, q);
  }

  @Get('students/:studentId/calendar')
  @RequirePermissions(P.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Monthly attendance calendar view for a student' })
  async calendar(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('studentId') id: string,
    @Query() q: D.StudentCalendarQueryDto,
  ) {
    await this.access.assertStudent(u, t, id);
    return this.svc.getStudentCalendar(t, id, q.month, q.year, q.subjectId);
  }

  @Get('analytics/shortage')
  @RequirePermissions(P.ATTENDANCE_VIEW, P.ANALYTICS_VIEW)
  @ApiOperation({ summary: 'Students below the threshold within my scope' })
  shortage(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: PaginationQueryDto) {
    return this.analytics.shortageList(u, t, q);
  }

  @Get('analytics/anomalies')
  @RequirePermissions(P.ATTENDANCE_CORRECT_APPROVE)
  @ApiOperation({ summary: 'Unusual marking patterns for HOD/admin review' })
  anomalies(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.analytics.anomalies(u, t);
  }
}
