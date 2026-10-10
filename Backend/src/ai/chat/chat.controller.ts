import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString } from 'class-validator';
import { P } from '../../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Principal } from '../../common/types/principal';
import { AdvisorService } from '../advisor/advisor.service';
import { Supervisor } from '../agents/supervisor';
import { ComplaintDraftService } from '../tools/complaint-draft.service';
import { ChatDto } from './dto/chat.dto';
import { ChatService } from './chat.service';

class AdvisorQuery {
  @IsOptional() @IsString() studentId?: string;
}

@ApiTags('AI')
@ApiBearerAuth()
@RequirePermissions(P.AI_CHAT)
@Controller('ai')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly advisor: AdvisorService,
    private readonly drafts: ComplaintDraftService,
    private readonly supervisor: Supervisor,
  ) {}

  @Post('chat')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'College AI assistant',
    description:
      "Supervisor routes the question to an agent (Academic, Attendance, Scholarship, Placement, Grievance, College Knowledge). Agents use permission-checked tools and RAG; the LLM never touches the database. Response separates `collegeData` (verified records) from the model's prose. For streaming use the WebSocket event `ai.chat`.",
  })
  send(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: ChatDto) {
    return this.chat.chat(u, t, dto);
  }

  @Get('agents') @ApiOperation({ summary: 'Available agents' }) agents() {
    return this.supervisor.agentList();
  }
  @Get('conversations') list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: PaginationQueryDto) {
    return this.chat.list(u, t, q);
  }
  @Get('conversations/:id/messages') messages(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Query() q: PaginationQueryDto,
  ) {
    return this.chat.messages(u, t, id, q);
  }
  @Delete('conversations/:id') @HttpCode(204) remove(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.chat.remove(u, t, id);
  }

  @Get('advisor')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Personal AI academic advisor',
    description:
      'Priority subjects, deadlines, attendance warnings and an explainable risk indicator. `collegeData` = facts; `recommendations` = generated suggestions (each lists what it is based on).',
  })
  advise(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: AdvisorQuery) {
    return this.advisor.advise(u, t, q.studentId);
  }

  @Post('grievance/drafts/:id/confirm')
  @HttpCode(201)
  @RequirePermissions(P.COMPLAINT_CREATE)
  @ApiOperation({
    summary: 'Confirm an AI-prepared complaint draft',
    description: "The ONLY way an AI-drafted complaint is filed — explicit user action, outside the model's control.",
  })
  confirm(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.drafts.confirm(u, t, id);
  }
  @Delete('grievance/drafts/:id')
  @HttpCode(204)
  @RequirePermissions(P.COMPLAINT_CREATE)
  cancel(@CurrentUser() u: Principal, @Param('id') id: string) {
    return this.drafts.cancel(u.userId, id);
  }
}
