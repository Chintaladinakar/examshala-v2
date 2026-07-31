import rateLimit from 'express-rate-limit';

// Applies to signin/signup: tolerant enough for legitimate retries, tight enough
// to blunt credential-stuffing / brute-force attempts against these unauthenticated endpoints.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
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
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many OTP requests. Please try again later.',
  },
});
