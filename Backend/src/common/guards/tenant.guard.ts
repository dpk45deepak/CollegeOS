import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC } from '../decorators/auth.decorators';
import { AuthedRequest } from '../types/principal';
import { RequestContext } from '../utils/request-context';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Establishes the tenant for the request. Normal users are pinned to their own college;
 * only SUPER_ADMIN may select a tenant explicitly with the `x-tenant-id` header.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (ctx.getType() !== 'http') return true;
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()])) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const user = req.user;
    if (!user) throw new ForbiddenException('No authenticated principal');

    let tenantId = user.collegeId ?? undefined;
    const requested = req.headers['x-tenant-id'];
    if (typeof requested === 'string' && requested.length > 0) {
      if (!user.isSuperAdmin) {
        if (requested !== user.collegeId) {
          throw new ForbiddenException({ message: 'Cross-tenant access denied', errorCode: 'TENANT_MISMATCH' });
        }
      } else {
        const exists = await this.prisma.college.findUnique({ where: { id: requested }, select: { id: true, status: true } });
        if (!exists) throw new BadRequestException({ message: 'Unknown tenant', errorCode: 'TENANT_UNKNOWN' });
        if (exists.status && exists.status !== 'ACTIVE') {
          throw new ForbiddenException({ message: 'Institution is suspended', errorCode: 'COLLEGE_SUSPENDED' });
        }
        tenantId = requested;
      }
    }
    if (!tenantId && !user.isSuperAdmin) {
      throw new ForbiddenException({ message: 'User has no tenant', errorCode: 'TENANT_MISSING' });
    }
    req.tenantId = tenantId;
    const store = RequestContext.get();
    if (store) store.tenantId = tenantId;
    return true;
  }
}
