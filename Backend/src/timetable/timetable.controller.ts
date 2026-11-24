import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import * as D from './dto/timetable.dto';
import { TimetableService } from './timetable.service';

class AvailabilityListDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => D.AvailabilityDto)
  windows!: D.AvailabilityDto[];
}

@ApiTags('Timetable')
@ApiBearerAuth()
@Controller('timetable')
export class TimetableController {
  constructor(private readonly svc: TimetableService) {}

  @Post('slots')
  @RequirePermissions(P.TIMETABLE_MANAGE)
  @ApiOperation({
    summary: 'Create a slot',
    description: 'Rejects with 409 TIMETABLE_CONFLICT listing section / teacher / room / availability conflicts.',
  })
  create(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateSlotDto) {
    return this.svc.create(u, t, dto);
  }
  @Post('check')
  @HttpCode(200)
  @RequirePermissions(P.TIMETABLE_MANAGE)
  @ApiOperation({ summary: 'Dry-run conflict check' })
  check(@CurrentUser() u: Principal, @Tenant() t: string, @Body() dto: D.CreateSlotDto) {
    return this.svc.check(u, t, dto);
  }
  @Delete('slots/:id')
  @HttpCode(204)
  @RequirePermissions(P.TIMETABLE_MANAGE)
  remove(@CurrentUser() u: Principal, @Tenant() t: string, @Param('id') id: string) {
    return this.svc.remove(u, t, id);
  }

  @Get('sections/:sectionId')
  @RequirePermissions(P.TIMETABLE_VIEW)
  section(@Tenant() t: string, @Param('sectionId') s: string) {
    return this.svc.forSection(t, s);
  }
  @Get('teachers/me')
  @RequirePermissions(P.TIMETABLE_VIEW)
  mine(@CurrentUser() u: Principal, @Tenant() t: string) {
    return this.svc.forTeacher(u, t);
  }

  @Put('teachers/:teacherId/availability')
  @RequirePermissions(P.TIMETABLE_MANAGE)
  availability(@CurrentUser() u: Principal, @Tenant() t: string, @Param('teacherId') id: string, @Body() dto: AvailabilityListDto) {
    return this.svc.setAvailability(u, t, id, dto.windows);
  }
  @Get('rooms') @RequirePermissions(P.TIMETABLE_VIEW) rooms(@Tenant() t: string) {
    return this.svc.listRooms(t);
  }
  @Post('rooms') @RequirePermissions(P.TIMETABLE_MANAGE) createRoom(@Tenant() t: string, @Body() dto: D.CreateRoomDto) {
    return this.svc.createRoom(t, dto);
  }
}
