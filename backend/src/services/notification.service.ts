import prisma from '../lib/prisma';
import { enqueueOrRun, QUEUE_NAMES } from '../lib/queue';
import logger from '../lib/logger';

export type CreateNotificationParams = {
  userId: string;
  workspaceId?: string | null;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
};

async function persistNotification(params: CreateNotificationParams) {
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
}

/**
 * Notifications are best-effort; a failure here must never break the underlying action.
 * When Redis/BullMQ is configured (REDIS_URL set), delivery is queued so the caller
 * doesn't wait on the DB write. Without it, this falls back to writing inline.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await enqueueOrRun(QUEUE_NAMES.notifications, 'create-notification', params, persistNotification);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create notification');
  }
}
