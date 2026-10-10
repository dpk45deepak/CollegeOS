import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
import { P } from '../auth/permissions';
import { CurrentUser, RequirePermissions, Tenant } from '../common/decorators/auth.decorators';
import { Principal } from '../common/types/principal';
import { SearchService } from './search.service';

class SearchQuery {
  @IsString() @MaxLength(80) q!: string;
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  types?: string[];
}

@ApiTags('Search')
@ApiBearerAuth()
@RequirePermissions(P.SEARCH)
@Controller('search')
export class SearchController {
  constructor(private readonly svc: SearchService) {}
  @Get()
  @ApiOperation({
    summary: 'Permission-aware global search',
    description:
      'Students, teachers, subjects, notices, documents, assignments, complaints, events. `types` filters sources (comma-separated). Private messages are never searched.',
  })
  search(@CurrentUser() u: Principal, @Tenant() t: string, @Query() q: SearchQuery) {
    return this.svc.search(u, t, q.q, q.types);
  }
}
