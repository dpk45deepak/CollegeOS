import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
  tenantId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  get: (): RequestContextStore | undefined => requestContext.getStore(),
  requestId: (): string | undefined => requestContext.getStore()?.requestId,
  requireTenantId(): string {
    const id = requestContext.getStore()?.tenantId;
    if (!id) throw new Error('Tenant context is not available for this request');
    return id;
  },
};
