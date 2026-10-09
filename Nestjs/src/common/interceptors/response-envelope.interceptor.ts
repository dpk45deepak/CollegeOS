import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SKIP_ENVELOPE } from '../decorators/skip-envelope.decorator';
import { Paginated } from '../dto/pagination.dto';
import { RequestContext } from '../utils/request-context';

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: unknown;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ENVELOPE, [context.getHandler(), context.getClass()]);
    if (skip) return next.handle();

    return next.handle().pipe(
      map((payload: unknown): SuccessEnvelope<unknown> => {
        const base = {
          success: true as const,
          timestamp: new Date().toISOString(),
          requestId: RequestContext.requestId(),
        };
        if (payload instanceof Paginated) return { ...base, data: payload.data, meta: payload.meta };
        return { ...base, data: payload ?? null };
      }),
    );
  }
}
