import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { NotificationsService } from './notifications.service';

class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Boolean) @IsBoolean() unread?: boolean;
}
class MarkReadDto {
  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) ids?: string[];
}
class DeviceDto {
  @IsString() @MaxLength(512) token!: string;
  @IsIn(['android', 'ios', 'web']) platform!: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}
  @Get() list(@CurrentUser() u: Principal, @Query() q: NotificationQueryDto) {
    return this.svc.list(u.userId, q, q.unread);
  }
  @Get('unread-count') count(@CurrentUser() u: Principal) {
    return this.svc.unreadCount(u.userId);
  }
  @Post('read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark notifications read (omit ids = all)' })
  read(@CurrentUser() u: Principal, @Body() dto: MarkReadDto) {
    return this.svc.markRead(u.userId, dto.ids);
  }
  @Post('devices')
  @HttpCode(204)
  @ApiOperation({ summary: 'Register a push token for this device' })
  async device(@CurrentUser() u: Principal, @Body() dto: DeviceDto) {
    await this.svc.registerDevice(u.userId, dto.token, dto.platform);
  }
}
