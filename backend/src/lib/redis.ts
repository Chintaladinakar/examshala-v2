import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

// Redis is optional infra: when REDIS_URL isn't set, `redis` stays null and every
// cache/queue helper below degrades to a no-op instead of throwing, so the app runs
// unchanged on setups without Redis provisioned yet.
export const redis: Redis | null = REDIS_URL
  ? new Redis(REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true })
  : null;

let connectionAttempted = false;

export async function ensureRedisConnected(): Promise<Redis | null> {
  if (!redis) return null;
  if (!connectionAttempted) {
    connectionAttempted = true;
    try {
      await redis.connect();
    } catch (error) {
      console.error('[redis] Failed to connect, caching/queues disabled:', (error as Error).message);
    }
  }
  return redis.status === 'ready' ? redis : null;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = await ensureRedisConnected();
  if (!client) return null;
  const raw = await client.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = await ensureRedisConnected();
  if (!client) return;
  await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(key: string | string[]): Promise<void> {
  const client = await ensureRedisConnected();
  if (!client) return;
  const keys = Array.isArray(key) ? key : [key];
  if (keys.length) await client.del(...keys);
}

/**
 * Read-through cache wrapper: returns the cached value if present, otherwise
 * computes it, caches it, and returns it. Falls back to calling `compute` directly
 * (uncached) whenever Redis isn't available.
 */
export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await compute();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
