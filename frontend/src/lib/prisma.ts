import { PrismaClient } from '../generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prisma's engine defaults to a connection pool sized off num_cpus, which is meaningless for a
// Next.js deployment (serverless function instances, not a fixed CPU count) and can rack up far
// more connections against Postgres/Neon than the backend's own fixed, explicitly-sized pool
// (see backend/src/lib/prisma.ts) — capping it here keeps the frontend's direct DB access from
// being the thing that exhausts the connection ceiling under load.
function scopedDatasourceUrl(): string | undefined {
  // Matches the env var this app's own prisma/schema.prisma datasource actually reads
  // (`env("DBPOST_uri")`) — not DATABASE_URL, which is the backend's variable.
  const raw = process.env.DBPOST_uri;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', String(Number(process.env.DB_POOL_MAX) || 3));
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '10');
    return url.toString();
  } catch {
    return raw;
  }
}

export const prisma: PrismaClient = globalThis.__prisma ?? new PrismaClient({ datasourceUrl: scopedDatasourceUrl() });


if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
