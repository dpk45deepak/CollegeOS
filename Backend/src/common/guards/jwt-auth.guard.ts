import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '@prisma/client';
import { IS_PUBLIC } from '../decorators/auth.decorators';
import { AuthedRequest } from '../types/principal';
import { RequestContext } from '../utils/request-context';
import { PrincipalService } from '../../security/principal.service';
import { TokenService } from '../../security/token.service';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

export const revokedKey = (sid: string) => `revoked:${sid}`;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly principals: PrincipalService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException({ message: 'Missing bearer token', errorCode: 'TOKEN_MISSING' });

    let payload;
    try {
      payload = this.tokens.verifyAccess(token);
    } catch {
      throw new UnauthorizedException({ message: 'Invalid or expired token', errorCode: 'TOKEN_INVALID' });
    }

    let isRevoked = false;
    if (this.redis.isHealthy()) {
      isRevoked = await this.redis.safeExists(revokedKey(payload.sid));
    }
    if (!isRevoked) {
      // Always verify authoritative session state in PostgreSQL so Redis restarts/flushes cannot un-revoke sessions.
      const session = await this.prisma.authSession.findUnique({
        where: { id: payload.sid },
        select: { revokedAt: true, expiresAt: true },
      });
      isRevoked = !session || !!session.revokedAt || session.expiresAt < new Date();
    }

    if (isRevoked) {
      throw new UnauthorizedException({ message: 'Session has been revoked', errorCode: 'SESSION_REVOKED' });
    }

    const principal = await this.principals.load(payload.sub);
    if (!principal || principal.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ message: 'Account is not active', errorCode: 'ACCOUNT_INACTIVE' });
    }
    if (principal.collegeStatus && principal.collegeStatus !== 'ACTIVE') {
      throw new UnauthorizedException({ message: 'Institution is suspended', errorCode: 'COLLEGE_SUSPENDED' });
    }
    const { status: _status, ...rest } = principal;
    req.user = { ...rest, sessionId: payload.sid };
    const store = RequestContext.get();
    if (store) store.userId = principal.userId;
    return true;
  }
}
