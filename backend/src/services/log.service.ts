import prisma from '../lib/prisma';
import logger from '../lib/logger';

interface LogParams {
  userId: string;
  action: 'USER_CREATED' | 'WORKSPACE_CREATED' | 'INVITE_SENT' | 'ROLE_ASSIGNED' | 'WORKSPACE_UPDATED' | 'WORKSPACE_DELETED' | 'USER_DELETED' | 'USER_UPDATED';
  entity: 'USER' | 'WORKSPACE' | 'INVITE' | 'SYSTEM';
  entityId: string;
  metadata?: any;
}

export const createSystemLog = async (params: LogParams) => {
  try {
    logger.info({ action: params.action, entity: params.entity, entityId: params.entityId, userId: params.userId }, 'audit log');
    return await prisma.log.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create system audit log');
  }
};
