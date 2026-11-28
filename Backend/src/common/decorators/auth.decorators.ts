import { BadRequestException, createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthedRequest, Principal } from '../types/principal';

export const IS_PUBLIC = 'isPublic';
export const PERMISSIONS_KEY = 'requiredPermissions';
export const ANY_PERMISSIONS_KEY = 'anyRequiredPermissions';

/** Skip authentication (login, health, ...). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** User must hold ALL listed permissions. */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
/** User must hold AT LEAST ONE of the listed permissions. */
export const RequireAnyPermission = (...permissions: string[]) => SetMetadata(ANY_PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): Principal => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as Principal;
});

/** Resolved tenant (college) id for this request. Throws if tenant is missing. */
export const Tenant = createParamDecorator((_d: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  const tenantId = req.tenantId;
  if (!tenantId) {
    throw new BadRequestException({
      message: 'Tenant context required. Please select a tenant or provide x-tenant-id header.',
      errorCode: 'TENANT_REQUIRED',
    });
  }
  return tenantId;
});
