import pino from 'pino';

// Structured JSON logs (so a log aggregator can index/query them) with a request-scoped child
// logger available as `req.log` (see middleware/requestLogger.middleware.ts) carrying the
// correlation ID through — the piece raw console.log calls have no way to provide.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } }
    : {}),
});

export default logger;
