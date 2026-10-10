import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { Paginated } from '../dto/pagination.dto';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

const ctx = { getHandler: () => undefined, getClass: () => undefined } as unknown as ExecutionContext;
const handler = (v: unknown): CallHandler => ({ handle: () => of(v) });

describe('ResponseEnvelopeInterceptor', () => {
  const make = (skip = false) =>
    new ResponseEnvelopeInterceptor({ getAllAndOverride: () => skip } as unknown as Reflector);

  it('wraps plain payloads', async () => {
    const out = (await lastValueFrom(make().intercept(ctx, handler({ a: 1 })))) as Record<string, unknown>;
    expect(out).toMatchObject({ success: true, data: { a: 1 } });
  });

  it('lifts Paginated into data + meta', async () => {
    const page = new Paginated([1], { page: 1, limit: 20, total: 1, totalPages: 1 });
    const out = (await lastValueFrom(make().intercept(ctx, handler(page)))) as Record<string, unknown>;
    expect(out.data).toEqual([1]);
    expect(out.meta).toMatchObject({ total: 1 });
  });

  it('skips wrapping when opted out', async () => {
    expect(await lastValueFrom(make(true).intercept(ctx, handler({ status: 'ok' })))).toEqual({ status: 'ok' });
  });
});
