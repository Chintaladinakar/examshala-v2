import { Job } from 'bullmq';
import prisma from '../lib/prisma';
import { registerWorker, QUEUE_NAMES } from '../lib/queue';
import logger from '../lib/logger';
import type { CreateNotificationParams } from '../services/notification.service';

/**
 * Only starts if REDIS_URL is configured (registerWorker returns null otherwise).
 * Consumes jobs enqueued by notification.service.createNotification.
 */
export function startNotificationWorker() {
  const worker = registerWorker<CreateNotificationParams>(QUEUE_NAMES.notifications, async (job: Job<CreateNotificationParams>) => {
    const params = job.data;
    await prisma.notification.create({
      data: {
        userId: params.userId,
        workspaceId: params.workspaceId || undefined,
        type: params.type,
        title: params.title,
        message: params.message,
        actionUrl: params.actionUrl,
      },
    });
  });

  if (worker) {
    worker.on('failed', (job, err) => {
      const attemptsMade = job?.attemptsMade ?? 0;
      const maxAttempts = job?.opts.attempts ?? 1;
      if (attemptsMade >= maxAttempts) {
        // Retries exhausted — this job is now dead-lettered: BullMQ keeps it (removeOnFail
        // retains recent failures, see lib/queue.ts) so it stays inspectable/replayable
        // from Redis instead of silently vanishing.
        logger.error({ jobId: job?.id, attemptsMade, data: job?.data, err }, '[notification.worker] Job dead-lettered');
      } else {
        logger.warn({ jobId: job?.id, attemptsMade, maxAttempts, err }, '[notification.worker] Job failed, will retry');
      }
    });
    logger.info('[notification.worker] Started (REDIS_URL detected)');
  }

  return worker;
}
