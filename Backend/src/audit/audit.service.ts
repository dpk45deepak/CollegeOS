import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/utils/request-context';

export interface AuditEntry {
  collegeId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

/** Strip anything that must never be persisted in an audit trail. */
const SENSITIVE = new Set([
  'passwordHash',
  'password',
  'refreshTokenHash',
  'tokenHash',
  'token',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
  'jwt',
]);
function scrub(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined || v === null) return undefined;
  return JSON.parse(JSON.stringify(v, (k, val) => (SENSITIVE.has(k) ? undefined : val))) as Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Insert-only. `tx` lets callers write the audit row in the same transaction as the change. */
  async log(entry: AuditEntry, tx?: Prisma.TransactionClient): Promise<void> {
    const ctx = RequestContext.get();
    const client = tx ?? this.prisma;
    try {
      await client.auditLog.create({
        data: {
          collegeId: entry.collegeId ?? ctx?.tenantId ?? null,
          userId: entry.userId ?? ctx?.userId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValue: scrub(entry.oldValue),
          newValue: scrub(entry.newValue),
          reason: entry.reason,
          ip: ctx?.ip,
          userAgent: ctx?.userAgent,
          requestId: ctx?.requestId,
        },
      });
    } catch (err) {
      if (tx) throw err; // inside a transaction an audit failure must roll the change back
      this.logger.error({ err }, 'Failed to write audit log');
    }
  }
}
