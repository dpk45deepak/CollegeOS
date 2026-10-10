import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Return this from a handler and the response interceptor emits { data, meta }. */
export class Paginated<T> {
  constructor(
    public readonly data: T[],
    public readonly meta: PageMeta,
  ) {}
}

export function toSkipTake(q: PaginationQueryDto): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.limit, take: q.limit };
}

export function paginate<T>(items: T[], total: number, q: PaginationQueryDto): Paginated<T> {
  return new Paginated(items, {
    page: q.page,
    limit: q.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  });
}
