import { PaginationQueryDto, paginate, toSkipTake } from './pagination.dto';

describe('pagination helpers', () => {
  const q = Object.assign(new PaginationQueryDto(), { page: 3, limit: 20 });

  it('computes skip/take', () => {
    expect(toSkipTake(q)).toEqual({ skip: 40, take: 20 });
  });

  it('builds meta with totalPages', () => {
    const p = paginate([1, 2], 100, Object.assign(new PaginationQueryDto(), { page: 1, limit: 20 }));
    expect(p.meta).toEqual({ page: 1, limit: 20, total: 100, totalPages: 5 });
  });

  it('reports at least one page for empty results', () => {
    expect(paginate([], 0, q).meta.totalPages).toBe(1);
  });
});
