import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { CampusService } from './campus.service';
import * as D from './dto/campus.dto';

@ApiTags('Notices & Events')
@ApiBearerAuth()
@Controller()
export class CampusController {
  constructor(private readonly svc: CampusService) {}

  @Post('notices') @RequirePermissions(P.NOTICE_CREATE) createNotice(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Body() d: D.CreateNoticeDto,
  ) {
    return this.svc.createNotice(u, t, d);
  }
  @Post('notices/:id/publish')
  @RequirePermissions(P.NOTICE_PUBLISH)
  @ApiOperation({
    summary: 'Publish a notice',
    description: 'Notifies the audience (in-app + WebSocket + push) and broadcasts a live announcement.',
  })
  publish(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.publishNotice(u, t, id);
  }
  @Get('notices') @RequirePermissions(P.NOTICE_VIEW) list(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query() q: PaginationQueryDto,
  ) {
    return this.svc.listNotices(u, t, q);
  }
  @Get('notices/drafts') @RequirePermissions(P.NOTICE_CREATE) drafts(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.myDrafts(u, t);
  }

  @Get('clubs') @RequirePermissions(P.EVENT_VIEW) clubs(@Tenant() t: string) {
    return this.svc.listClubs(t);
  }
  @Post('clubs') @RequirePermissions(P.EVENT_MANAGE) createClub(@Tenant() t: string, @Body() d: D.CreateClubDto) {
    return this.svc.createClub(t, d);
  }
  @Get('events') @RequirePermissions(P.EVENT_VIEW) events(@Tenant() t: string, @Query() q: PaginationQueryDto) {
    return this.svc.listEvents(t, q);
  }
  @Post('events') @RequirePermissions(P.EVENT_MANAGE) createEvent(@Tenant() t: string, @Body() d: D.CreateEventDto) {
    return this.svc.createEvent(t, d);
  }
  @Patch('events/:id') @RequirePermissions(P.EVENT_MANAGE) updateEvent(
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() d: D.UpdateEventDto,
  ) {
    return this.svc.updateEvent(t, id, d);
  }
}
