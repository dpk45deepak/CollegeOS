import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../config/app-config.service';

export interface ErrorEnvelope {
  success: false;
  statusCode: number;
  message: string | string[];
  errorCode: string;
  details?: Record<string, unknown>;
  conflicts?: unknown;
  reasons?: unknown;
  timestamp: string;
  requestId?: string;
}

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/** Structural check for Prisma known-request errors (no hard dependency on generated types). */
function prismaCode(e: unknown): string | undefined {
  if (typeof e === 'object' && e !== null && 'code' in e && 'clientVersion' in e) {
    const code = (e as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

interface Normalised {
  statusCode: number;
  message: string | string[];
  errorCode: string;
  extra?: Pick<ErrorEnvelope, 'details' | 'conflicts' | 'reasons'>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly config: AppConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request & { id?: string }>();

    const { statusCode, message, errorCode, extra } = this.normalise(exception);

    if (statusCode >= 500) {
      // Full detail goes to logs/error tracking only — never to the client in production.
      this.logger.error({ err: exception, requestId: req.id, path: req.url }, 'Unhandled exception');
    }

    const body: ErrorEnvelope = {
      success: false,
      statusCode,
      message,
      errorCode,
      ...(extra ?? {}),
      timestamp: new Date().toISOString(),
      requestId: req.id,
    };
    res.status(statusCode).json(body);
  }

  private normalise(exception: unknown): Normalised {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const r = exception.getResponse();
      const obj = typeof r === 'object' && r !== null ? (r as Record<string, unknown>) : {};
      const message = (typeof r === 'string' ? r : (obj.message as string | string[])) ?? exception.message;
      const errorCode =
        typeof obj.errorCode === 'string'
          ? obj.errorCode
          : Array.isArray(message) && statusCode === 400
            ? 'VALIDATION_ERROR'
            : (STATUS_CODES[statusCode] ?? 'HTTP_ERROR');
      const extra: Pick<ErrorEnvelope, 'details' | 'conflicts' | 'reasons'> = {};
      if (obj.conflicts !== undefined) extra.conflicts = obj.conflicts;
      if (obj.reasons !== undefined) extra.reasons = obj.reasons;
      if (typeof obj.details === 'object' && obj.details !== null) extra.details = obj.details as Record<string, unknown>;
      return { statusCode, message, errorCode, extra: Object.keys(extra).length ? extra : undefined };
    }

    switch (prismaCode(exception)) {
      case 'P2002':
        return { statusCode: 409, message: 'A record with these unique values already exists', errorCode: 'CONFLICT' };
      case 'P2025':
        return { statusCode: 404, message: 'Record not found', errorCode: 'NOT_FOUND' };
      case 'P2003':
        return {
          statusCode: 409,
          message: 'Operation violates a relationship constraint',
          errorCode: 'RELATION_CONSTRAINT',
        };
      default:
        break;
    }

    const message =
      this.config.isProduction || !(exception instanceof Error) ? 'Internal server error' : exception.message;
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message, errorCode: 'INTERNAL_ERROR' };
  }
}
