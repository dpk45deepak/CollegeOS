import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { P } from '../auth/permissions';
import { RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PaginationQueryDto, paginate, toSkipTake } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';

class AuditQuery extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() entity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() from?: Date;
  @ApiPropertyOptional() @IsOptional() @Type(() => Date) @IsDate() to?: Date;
}

/** Read-only. There is intentionally no update/delete endpoint; the database also rejects UPDATE/DELETE on AuditLog. */
@ApiTags('Audit')
@ApiBearerAuth()
@RequirePermissions(P.AUDIT_VIEW)
@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Audit trail (append-only)' })
  async list(@Tenant() t: string, @Query() q: AuditQuery) {
    const where = {
      collegeId: t,
      entity: q.entity,
      entityId: q.entityId,
      userId: q.userId,
      action: q.action,
      createdAt: { gte: q.from, lte: q.to },
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(q) }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginate(items, total, q);
  }
  @Get('entity/:entity/:id')
  @ApiOperation({ summary: 'Full history of one record (e.g. an attendance row)' })
  history(@Tenant() t: string, @Param('entity') entity: string, @Param('id') id: string) {
    return this.prisma.auditLog.findMany({
      where: { collegeId: t, entity, entityId: id },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }
}
