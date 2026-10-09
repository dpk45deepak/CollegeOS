import { Controller, Get, HttpCode, Param, Post, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { Principal } from '../common/types/principal';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@RequirePermissions(P.REPORT_EXPORT)
@Controller('reports')
export class ReportsController {
  constructor(private readonly svc: ReportsService) {}

  @Get('files/download')
  @SkipEnvelope()
  async download(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const f = await this.svc.file(u, t, key);
    res.set({ 'content-type': f.contentType, 'content-disposition': `attachment; filename="${f.filename}"` });
    return new StreamableFile(f.body);
  }

  @Get(':type')
  @SkipEnvelope()
  @ApiOperation({
    summary: 'Export a report as CSV',
    description:
      'Types: attendance, performance, fees, placements, complaints, scholarships. Scoped to what the caller may see. Cells are protected against spreadsheet formula injection.',
  })
  async csv(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('type') type: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const f = await this.svc.csv(u, t, this.svc.assertType(type));
    res.set({
      'content-type': f.contentType,
      'content-disposition': `attachment; filename="${f.filename}"`,
      'x-content-type-options': 'nosniff',
    });
    return new StreamableFile(f.body);
  }

  @Post(':type/async')
  @HttpCode(202)
  @ApiOperation({ summary: 'Generate a large report in the background; you are notified when it is ready' })
  async(@CurrentUser() u: Principal, @Tenant() t: string, @Param('type') type: string) {
    return this.svc.enqueue(u, t, this.svc.assertType(type));
  }
}
