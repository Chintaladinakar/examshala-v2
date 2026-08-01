import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  workspaceId: string | null;
}

// Set once per request (see auth.middleware.ts `protect`) from the authenticated user's
// workspaceId, then read by the Prisma tenant-scoping extension (see lib/prisma.ts) so query
// filtering doesn't need to be threaded through every controller call by hand.
export const tenantContext = new AsyncLocalStorage<TenantContext>();

export function getCurrentWorkspaceId(): string | null {
  return tenantContext.getStore()?.workspaceId ?? null;
}
