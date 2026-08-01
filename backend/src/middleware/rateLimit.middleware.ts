import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis';

// With more than one backend instance behind a load balancer, express-rate-limit's default
// in-memory store resets per-process — an attacker spreads requests across instances and the
// "20 req/15min" limit effectively becomes 20*N. Backing the counter with the shared Redis
// instance makes the limit hold across every instance. Falls back to the in-memory store
// (single-instance only) when REDIS_URL isn't configured, matching every other Redis-optional
// helper in this codebase (see src/lib/redis.ts).
function redisStore(prefix: string) {
  if (!redis) return undefined;
  const client = redis;
  return new RedisStore({
    prefix,
    // rate-limit-redis expects a (...args) => Promise<any> shape; ioredis's `call` matches it.
    sendCommand: (...args: string[]) => (client.call as (...a: string[]) => Promise<any>)(...args),
  });
}

// Applies to signin/signup: tolerant enough for legitimate retries, tight enough
// to blunt credential-stuffing / brute-force attempts against these unauthenticated endpoints.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('rl:auth:'),
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many attempts. Please try again later.',
  },
});

// Applies to OTP request endpoints, which each trigger an outbound email —
// stricter than the general auth limiter to prevent mail-bombing an inbox.
export const otpRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore('rl:otp:'),
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many OTP requests. Please try again later.',
  },
});
