import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { P } from '../auth/permissions';
import { RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';

class UsageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(90) days?: number;
}

@ApiTags('AI · Admin')
@ApiBearerAuth()
@RequirePermissions(P.AI_ADMIN)
@Controller('ai/admin')
export class AiAdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('usage')
  @ApiOperation({
    summary: 'AI observability: calls, latency, tokens, errors by model (no prompts or answers are stored)',
  })
  async usage(@Tenant() t: string, @Query() q: UsageQuery) {
    const since = new Date(Date.now() - (q.days ?? 7) * 86_400_000);
    const where = { collegeId: t, createdAt: { gte: since } };
    const [byModel, errors, recent, tools] = await Promise.all([
      this.prisma.aiCallLog.groupBy({
        by: ['provider', 'model', 'kind'],
        where,
        _count: { _all: true },
        _avg: { latencyMs: true },
        _sum: { promptTokens: true, completionTokens: true },
      }),
      this.prisma.aiCallLog.count({ where: { ...where, error: { not: null } } }),
      this.prisma.aiCallLog.findMany({
        where: { ...where, error: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { createdAt: true, model: true, kind: true, error: true, latencyMs: true },
      }),
      this.prisma.aiCallLog.findMany({ where: { ...where, kind: 'chat' }, select: { toolCalls: true }, take: 5000 }),
    ]);
    const toolUse: Record<string, number> = {};
    for (const r of tools) for (const n of (r.toolCalls as string[] | null) ?? []) toolUse[n] = (toolUse[n] ?? 0) + 1;
    return {
      since,
      byModel: byModel.map((m) => ({
        provider: m.provider,
        model: m.model,
        kind: m.kind,
        calls: m._count._all,
        avgLatencyMs: Math.round(m._avg.latencyMs ?? 0),
        promptTokens: m._sum.promptTokens ?? 0,
        completionTokens: m._sum.completionTokens ?? 0,
      })),
      errors,
      recentErrors: recent,
      toolUse,
    };
  }
}
