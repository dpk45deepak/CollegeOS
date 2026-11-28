import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ANY_PERMISSIONS_KEY, IS_PUBLIC, PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { AuthedRequest } from '../types/principal';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    if (ctx.getType() !== 'http') return true;
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, targets);
    const anyOf = this.reflector.getAllAndOverride<string[] | undefined>(ANY_PERMISSIONS_KEY, targets);
    if ((!required || required.length === 0) && (!anyOf || anyOf.length === 0)) return true; // authenticated-only route
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (required && required.length > 0) {
      const missing = required.filter((p) => !user?.permissions.includes(p));
      if (missing.length > 0) {
        throw new ForbiddenException({ message: 'Insufficient permissions', errorCode: 'PERMISSION_DENIED' });
      }
    }
    if (anyOf && anyOf.length > 0) {
      if (!anyOf.some((p) => user?.permissions.includes(p))) {
        throw new ForbiddenException({ message: 'Insufficient permissions', errorCode: 'PERMISSION_DENIED' });
      }
    }
    return true;
  }
}
