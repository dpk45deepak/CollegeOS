import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { P } from '../auth/permissions';
import { AttendanceQueryDto, StudentCalendarQueryDto } from '../attendance/dto/attendance.dto';
import { AssignmentListQueryDto } from '../assignments/dto/assignments.dto';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { PortalService } from './portal.service';

class WardQuery {
  @ApiPropertyOptional({ description: 'Parents: which ward' }) @IsOptional() @IsString() studentId?: string;
}
class AttendanceRecordsQuery extends AttendanceQueryDto {
  @IsOptional() @IsString() studentId?: string;
}
class AssignmentsQuery extends AssignmentListQueryDto {
  @IsOptional() @IsString() studentId?: string;
}

@ApiTags('Student Portal')
@ApiBearerAuth()
@Controller('students/me')
export class PortalController {
  constructor(private readonly svc: PortalService) {}

  @Get('dashboard')
  @RequirePermissions(P.STUDENT_VIEW_OWN)
  @ApiOperation({
    summary: 'Everything on one screen',
    description:
      "Attendance, today's classes, assignments, exams, fees, notices, events, job matches, scholarships, complaints, academic insight. A failing section degrades to {error} instead of failing the page.",
  })
  dashboard(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: WardQuery) {
    return this.svc.dashboard(u, t, this.svc.studentId(u, q.studentId));
  }

  @Get('attendance')
  @RequirePermissions(P.ATTENDANCE_VIEW_OWN)
  @ApiOperation({ summary: 'My attendance by subject + shortage maths + flags' })
  attendance(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: WardQuery) {
    return this.svc.attendanceReport(t, this.svc.studentId(u, q.studentId));
  }
  @Get('attendance/records')
  @RequirePermissions(P.ATTENDANCE_VIEW_OWN)
  records(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: AttendanceRecordsQuery) {
    return this.svc.attendanceRecords(t, this.svc.studentId(u, q.studentId), q);
  }
  @Get('attendance/calendar')
  @RequirePermissions(P.ATTENDANCE_VIEW_OWN)
  @ApiOperation({ summary: 'Monthly subject attendance calendar view for student' })
  calendar(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: StudentCalendarQueryDto) {
    return this.svc.attendanceCalendar(t, this.svc.studentId(u, q.studentId), q);
  }
  @Get('timetable') @RequirePermissions(P.TIMETABLE_VIEW) timetable(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: WardQuery,
  ) {
    return this.svc.timetableFor(t, this.svc.studentId(u, q.studentId));
  }
  @Get('assignments') @RequirePermissions(P.ASSIGNMENT_VIEW) assignments(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: AssignmentsQuery,
  ) {
    return this.svc.assignmentsFor(t, this.svc.studentId(u, q.studentId), q);
  }
  @Get('exams') @RequirePermissions(P.EXAM_VIEW) exams(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: WardQuery,
  ) {
    return this.svc.examsFor(t, this.svc.studentId(u, q.studentId));
  }
  @Get('results') @RequirePermissions(P.RESULT_VIEW_OWN) results(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: WardQuery,
  ) {
    return this.svc.resultsFor(t, this.svc.studentId(u, q.studentId));
  }
  @Get('fees') @RequirePermissions(P.FEE_VIEW_OWN) fees(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: WardQuery,
  ) {
    return this.svc.feesFor(t, this.svc.studentId(u, q.studentId));
  }
}
