import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import logger from '../lib/logger';

// Attaches req.log (a pino child logger tagged with a correlation ID) and logs one structured
// line per request. The ID is read from X-Request-Id when the frontend proxy already generated
// one (see frontend/src/lib/fetch-with-timeout.ts callers) so a single user action can be
// traced end-to-end: frontend proxy -> this backend -> any worker job it enqueues.
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers['x-request-id'];
    const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Trim noisy fields from the default req/res serializers — we care about method/url/status,
  // not full header dumps on every line.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
