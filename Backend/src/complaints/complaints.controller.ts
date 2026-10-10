import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { ComplaintsService } from './complaints.service';
import * as D from './dto/complaints.dto';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly svc: ComplaintsService) {}

  @Post()
  @RequirePermissions(P.COMPLAINT_CREATE)
  @ApiOperation({
    summary: 'File a complaint',
    description:
      'Category/priority are auto-detected when omitted and the ticket is routed to the right desk with an SLA. Sensitive reports are always critical → college admin.',
  })
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateComplaintDto) {
    return this.svc.create(u, t, dto);
  }

  @Post('route-preview')
  @HttpCode(200)
  @RequirePermissions(P.COMPLAINT_CREATE)
  @ApiOperation({ summary: '"Who should I contact?" — preview category, desk, priority and assignee without filing' })
  preview(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.RoutePreviewDto) {
    return this.svc.previewRoute(u, t, dto.text);
  }

  @Get('my') @RequirePermissions(P.COMPLAINT_VIEW_OWN) mine(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: D.ComplaintQueryDto,
  ) {
    return this.svc.mine(u, t, q);
  }
  @Get()
  @RequirePermissions(P.COMPLAINT_MANAGE)
  @ApiOperation({ summary: 'Work queue: complaints assigned to me / my department (admin: all), most urgent first' })
  queue(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.ComplaintQueryDto) {
    return this.svc.queue(u, t, q);
  }
  @Get(':id') get(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.get(u, t, id);
  }

  @Post(':id/status') @HttpCode(200) @RequirePermissions(P.COMPLAINT_MANAGE) status(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.ChangeStatusDto,
  ) {
    return this.svc.changeStatus(u, t, id, dto);
  }
  @Post(':id/assign') @HttpCode(200) @RequirePermissions(P.COMPLAINT_MANAGE) assign(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.AssignComplaintDto,
  ) {
    return this.svc.assign(u, t, id, dto);
  }
  @Post(':id/comments') comment(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.CommentDto,
  ) {
    return this.svc.comment(u, t, id, dto);
  }
  @Post(':id/feedback')
  @HttpCode(200)
  @RequirePermissions(P.COMPLAINT_VIEW_OWN)
  @ApiOperation({ summary: 'Student feedback after resolution → closes (or reopens) the ticket' })
  feedback(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string, @Body() dto: D.FeedbackDto) {
    return this.svc.feedback(u, t, id, dto);
  }
}
