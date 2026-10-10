import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { Principal } from '../common/types/principal';
import { AssignRolesDto, CreateUserDto } from './dto/users.dto';
import { UsersService } from './users.service';

class SetStatusDto {
  @IsEnum(UserStatus) status!: UserStatus;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'My account + roles' })
  me(@CurrentUser() user: Principal) {
    return this.users.me(user.userId);
  }

  @Get()
  @RequirePermissions(P.USER_MANAGE)
  @ApiOperation({ summary: 'List users in my college', description: 'Permission: USER_MANAGE' })
  list(@Tenant() tenant: string, @Query() q: PaginationQueryDto, @Query('search') search?: string) {
    return this.users.list(tenant, q, search);
  }

  @Post()
  @RequirePermissions(P.USER_MANAGE)
  @ApiOperation({ summary: 'Create a staff/other user', description: 'Permission: USER_MANAGE' })
  create(@Tenant() tenant: string, @CurrentUser() actor: Principal, @Body() dto: CreateUserDto) {
    return this.users.create(tenant, dto, actor.userId);
  }

  @Patch(':id/roles')
  @RequirePermissions(P.USER_MANAGE)
  @ApiOperation({ summary: "Replace a user's roles", description: 'Permission: USER_MANAGE. Audited.' })
  roles(
    @Tenant() tenant: string,
    @CurrentUser() actor: Principal,
    @Param('id') id: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.users.assignRoles(tenant, id, dto, actor.userId);
  }

  @Patch(':id/status')
  @RequirePermissions(P.USER_MANAGE)
  @ApiOperation({ summary: 'Activate / deactivate a user', description: 'Deactivation revokes all sessions.' })
  status(
    @Tenant() tenant: string,
    @CurrentUser() actor: Principal,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.users.setStatus(tenant, id, dto.status, actor.userId);
  }
}
