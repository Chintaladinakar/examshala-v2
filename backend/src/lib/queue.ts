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

export const QUEUE_NAMES = {
  notifications: 'notifications',
  email: 'email',
  reportGeneration: 'report-generation',
  reminders: 'reminders',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const queues = new Map<QueueName, Queue>();

/**
 * Returns a BullMQ queue, or null when REDIS_URL isn't configured. Callers should
 * fall back to processing the job inline (synchronously) when this returns null,
 * so the app behaves identically with or without Redis provisioned.
 */
export function getQueue(name: QueueName): Queue | null {
  if (!connection) return null;
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection }));
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
