import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { Principal } from '../common/types/principal';
import { DocumentsService } from './documents.service';
import * as D from './dto/documents.dto';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  @Post()
  @RequirePermissions(P.DOCUMENT_UPLOAD)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'documentType'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        documentType: { type: 'string' },
        visibility: { type: 'string' },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a knowledge document (pdf/docx/txt)',
    description:
      'Validated by content, malware-scanned, stored, then processed asynchronously: UPLOADED → PROCESSING → READY | FAILED. Default visibility is ADMIN_ONLY.',
  })
  upload(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: D.UploadDocumentDto,
  ) {
    if (!file) throw new BadRequestException('file is required');
    return this.svc.upload(u, t, file, dto);
  }

  @Get()
  @RequirePermissions(P.DOCUMENT_VIEW)
  @ApiOperation({ summary: 'Documents I am allowed to see' })
  list(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: D.DocumentQueryDto) {
    return this.svc.list(u, t, q);
  }
  @Get(':id') @RequirePermissions(P.DOCUMENT_VIEW) get(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.get(u, t, id);
  }
  @Get(':id/download')
  @SkipEnvelope()
  @RequirePermissions(P.DOCUMENT_VIEW)
  async download(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const f = await this.svc.download(u, t, id);
    res.set({
      'content-type': f.mime,
      'content-disposition': `attachment; filename="${f.filename}"`,
      'x-content-type-options': 'nosniff',
    });
    return new StreamableFile(f.buffer);
  }
  @Patch(':id/visibility')
  @RequirePermissions(P.DOCUMENT_UPLOAD)
  @ApiOperation({ summary: 'Change who can read a document (also re-labels its vector chunks)' })
  visibility(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
    @Body() dto: D.UpdateVisibilityDto,
  ) {
    return this.svc.updateVisibility(u, t, id, dto);
  }
  @Post(':id/reprocess') @HttpCode(202) @RequirePermissions(P.DOCUMENT_UPLOAD) reprocess(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.reprocess(u, t, id);
  }
  @Delete(':id') @HttpCode(204) @RequirePermissions(P.DOCUMENT_DELETE) remove(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Param('id') id: string,
  ) {
    return this.svc.remove(u, t, id);
  }
}
