import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '../utils/request-context';

const SAFE_ID = /^[A-Za-z0-9._-]{8,128}$/;

/** Reads the request ID set by the logger (or generates one) and opens the AsyncLocalStorage context. */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existing = (req as Request & { id?: unknown }).id;
    const inbound = req.headers['x-request-id'];
    const requestId =
      typeof existing === 'string'
        ? existing
        : typeof inbound === 'string' && SAFE_ID.test(inbound)
          ? inbound
          : randomUUID();
    (req as Request & { id?: string }).id = requestId;
    res.setHeader('x-request-id', requestId);
    requestContext.run({ requestId, ip: req.ip, userAgent: req.headers['user-agent']?.slice(0, 255) }, next);
  }
}
