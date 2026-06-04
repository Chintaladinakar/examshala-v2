import 'dotenv/config';
import prisma from '../lib/prisma';

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a unique, short, and brand-consistent 8-character Workspace ID.
 * Prefixed with 'ES-' (EDUsphere) followed by 5 random alphanumeric characters,
 * excluding highly confusing visual duplicates (0, O, I, 1, and L).
 */
function generateFancyId(): string {
  let code = 'ES-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function migrate() {
  try {
    console.log('Fetching all workspaces...');
    const workspaces = await prisma.workspace.findMany();

    for (const ws of workspaces) {
      // Check if it is already a fancy 8-char ID (starts with ES- and has length 8)
      if (ws.id.startsWith('ES-') && ws.id.length === 8) {
        console.log(`Workspace "${ws.name}" already has a fancy ID: ${ws.id}`);
        continue;
      }

      // Generate a new unique fancy ID
      let newId = generateFancyId();
      let isUnique = false;
      while (!isUnique) {
        const existing = await prisma.workspace.findUnique({ where: { id: newId } });
        if (!existing) {
          isUnique = true;
        } else {
          newId = generateFancyId();
        }
      }

      console.log(`Migrating "${ws.name}" from UUID ${ws.id} to fancy ID ${newId}...`);

      // 1. Create a temporary copy of the workspace with the new ID
      await prisma.workspace.create({
        data: {
          id: newId,
          name: ws.name,
          createdBy: ws.createdBy,
          principalId: ws.principalId,
          status: ws.status,
          createdAt: ws.createdAt,
        },
      });

      // 2. Update referencing tables
      // User
      const userUpdate = await prisma.user.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${userUpdate.count} Users`);

      // WorkspaceMembership
      const membershipUpdate = await prisma.workspaceMembership.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${membershipUpdate.count} WorkspaceMemberships`);

      // StudentWorkspaceProfile
      const profileUpdate = await prisma.studentWorkspaceProfile.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${profileUpdate.count} StudentWorkspaceProfiles`);

      // AssessmentAssignment
      const assignmentUpdate = await prisma.assessmentAssignment.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${assignmentUpdate.count} AssessmentAssignments`);

      // Notification
      const notificationUpdate = await prisma.notification.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${notificationUpdate.count} Notifications`);

      // Class
      const classUpdate = await prisma.class.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${classUpdate.count} Classes`);

      // Invite
      const inviteUpdate = await prisma.invite.updateMany({
        where: { workspaceId: ws.id },
        data: { workspaceId: newId },
      });
      console.log(`- Updated ${inviteUpdate.count} Invites`);

      // 3. Delete the old workspace
      await prisma.workspace.delete({
        where: { id: ws.id },
      });

      console.log(`✅ Successfully migrated "${ws.name}" to ${newId}\n`);
    }

    console.log('🎉 Workspace migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
