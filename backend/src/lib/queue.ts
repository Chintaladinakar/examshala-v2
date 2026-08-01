import { Queue, Worker, type Processor, type ConnectionOptions } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL;

const connection: ConnectionOptions | null = REDIS_URL
  ? (() => {
      const url = new URL(REDIS_URL);
      return {
        host: url.hostname,
        port: Number(url.port || 6379),
        password: url.password || undefined,
        username: url.username || undefined,
      };
    })()
  : null;

// Only queues with a real producer *and* consumer belong here. `email`/`report-generation`/
// `reminders` were previously declared with neither wired up — dead code that implied
// capabilities (async email delivery, scheduled reports, reminder jobs) the app doesn't
// actually have. Add a name back here only alongside the worker that consumes it.
export const QUEUE_NAMES = {
  notifications: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

// Every job gets 3 attempts with exponential backoff before it's considered permanently failed.
// Failed jobs are kept (not immediately discarded) so they remain inspectable in Redis as a
// lightweight dead-letter queue — see the 'failed' handler in notification.worker.ts, which
// logs distinctly once retries are exhausted.
const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 } as const,
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
};

/**
 * Returns a BullMQ queue, or null when REDIS_URL isn't configured. Callers should
 * fall back to processing the job inline (synchronously) when this returns null,
 * so the app behaves identically with or without Redis provisioned.
 */
export function getQueue(name: QueueName): Queue | null {
  if (!connection) return null;
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection, defaultJobOptions: DEFAULT_JOB_OPTIONS }));
  }
  return queues.get(name)!;
}

export function registerWorker<T = unknown>(name: QueueName, processor: Processor<T>): Worker<T> | null {
  if (!connection) return null;
  return new Worker<T>(name, processor, { connection });
}

/**
 * Enqueues a job if Redis/BullMQ is available; otherwise runs `inlineFallback`
 * immediately so callers don't need to branch on whether Redis is configured.
 */
export async function enqueueOrRun<T>(
  queueName: QueueName,
  jobName: string,
  data: T,
  inlineFallback: (data: T) => Promise<void>
): Promise<void> {
  const queue = getQueue(queueName);
  if (queue) {
    await queue.add(jobName, data);
    return;
  }
  await inlineFallback(data);
}
