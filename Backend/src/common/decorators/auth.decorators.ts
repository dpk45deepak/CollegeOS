import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthedRequest, Principal } from '../types/principal';

export const IS_PUBLIC = 'isPublic';
export const PERMISSIONS_KEY = 'requiredPermissions';

/** Skip authentication (login, health, ...). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** User must hold ALL listed permissions. */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): Principal => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as Principal;
});

/** Resolved tenant (college) id for this request. */
export const Tenant = createParamDecorator((_d: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().tenantId as string;
});
