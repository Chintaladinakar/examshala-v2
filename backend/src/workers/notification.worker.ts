import { Job } from 'bullmq';
import prisma from '../lib/prisma';
import { registerWorker, QUEUE_NAMES } from '../lib/queue';
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
      console.error(`[notification.worker] Job ${job?.id} failed:`, err.message);
    });
    console.log('[notification.worker] Started (REDIS_URL detected)');
  }

  return worker;
}
