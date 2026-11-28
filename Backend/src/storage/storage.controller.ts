import { BadRequestException, Controller, Get, Post, Query, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser, Tenant } from '../common/decorators/auth.decorators';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';
import { Principal } from '../common/types/principal';
import { detectFileType, safeName } from './file-validation';
import { StorageService } from './storage.service';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('download')
  @SkipEnvelope()
  @ApiOperation({ summary: 'Download an attachment by key' })
  async download(
    @CurrentUser() u: Principal,
    @Tenant() t: string,
    @Query('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!key) throw new BadRequestException('key is required');
    await this.storage.authorizeDownload(u, t, key);
    const body = await this.storage.read(key);
    const detected = detectFileType(body);
    const filename = safeName(key.split('/').pop() || 'attachment');
    res.set({
      'content-type': detected?.mime ?? 'application/octet-stream',
      'content-disposition': `attachment; filename="${filename}"`,
      'x-content-type-options': 'nosniff',
    });
    return new StreamableFile(body);
  }

  @Post('attachments')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({
    summary: 'Upload an attachment (pdf/png/jpg/docx/txt)',
    description:
      'Returns a storage key to reference from assignments/submissions/notices. Type is detected from content, not extension.',
  })
  async attachment(@CurrentUser() u: Principal, @Tenant() t: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    return this.storage.upload({
      collegeId: t,
      ownerId: u.userId,
      scope: 'attachments',
      file: file.buffer,
      originalName: file.originalname,
      allowedExts: ['pdf', 'png', 'jpg', 'docx', 'txt'],
    });
  }
}
