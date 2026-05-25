import prisma from '../lib/prisma';

interface LogParams {
  userId: string;
  action: 'USER_CREATED' | 'WORKSPACE_CREATED' | 'INVITE_SENT' | 'ROLE_ASSIGNED' | 'WORKSPACE_UPDATED' | 'WORKSPACE_DELETED' | 'USER_DELETED' | 'USER_UPDATED';
  entity: 'USER' | 'WORKSPACE' | 'INVITE' | 'SYSTEM';
  entityId: string;
  metadata?: any;
}

export const createSystemLog = async (params: LogParams) => {
  try {
    console.log(`[audit log] ${params.action} on ${params.entity}:${params.entityId} by user ${params.userId}`);
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
    console.error('Failed to create system audit log:', error);
  }
};
