import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserStatus } from '@prisma/client';
import { IS_PUBLIC } from '../decorators/auth.decorators';
import { AuthedRequest } from '../types/principal';
import { RequestContext } from '../utils/request-context';
import { PrincipalService } from '../../security/principal.service';
import { TokenService } from '../../security/token.service';
import { RedisService } from '../../redis/redis.service';

export const revokedKey = (sid: string) => `revoked:${sid}`;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly principals: PrincipalService,
    private readonly redis: RedisService,
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
    if (await this.redis.client.exists(revokedKey(payload.sid))) {
      throw new UnauthorizedException({ message: 'Session has been revoked', errorCode: 'SESSION_REVOKED' });
    }
    const principal = await this.principals.load(payload.sub);
    if (!principal || principal.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ message: 'Account is not active', errorCode: 'ACCOUNT_INACTIVE' });
    }
    const { status: _status, ...rest } = principal;
    req.user = { ...rest, sessionId: payload.sid };
    const store = RequestContext.get();
    if (store) store.userId = principal.userId;
    return true;
  }
}
