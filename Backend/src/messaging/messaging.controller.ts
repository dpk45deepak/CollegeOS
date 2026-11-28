import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import * as D from './dto/messaging.dto';
import { MessagingService } from './messaging.service';

@ApiTags('Messaging')
@ApiBearerAuth()
@RequirePermissions(P.MESSAGE_SEND)
@Controller('messages')
export class MessagingController {
  constructor(private readonly svc: MessagingService) {}
  @Post('conversations')
  @ApiOperation({
    summary: 'Start (or reuse) a direct conversation',
    description:
      'Allowed: Student↔Teacher (of their subjects), Student↔HOD/Admin, Teacher↔HOD. Private: never indexed by search or RAG.',
  })
  start(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.StartConversationDto) {
    return this.svc.start(u, t, dto);
  }
  @Get('recipients')
  @ApiOperation({ summary: 'List eligible messaging contacts scoped by your role' })
  recipients(@CurrentUser() u: Principal, @Tenant() t: string, @Query('search') search?: string) {
    return this.svc.listRecipients(u, t, search);
  }

  @Get('conversations') list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: PaginationQueryDto) {
    return this.svc.conversations(u, t, q);
  }
  @Get('conversations/:id') msgs(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    return this.svc.messages(u, t, id, q);
  }
  @Post('conversations/:id') send(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.SendMessageDto,
  ) {
    return this.svc.send(u, t, id, dto.content);
  }
  @Post('announcements')
  @ApiOperation({ summary: 'Department announcement (HOD/admin)' })
  announce(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.AnnouncementDto) {
    return this.svc.announce(u, t, dto);
  }
}
