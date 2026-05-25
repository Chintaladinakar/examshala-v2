import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import crypto from 'crypto';

const seedAdmin = async () => {
  try {
    console.log('Clearing old system logs, invites, and workspaces (selective)...');
    
    // 1. Seed Org Admin
    const adminEmail = 'admin@examshala.com';
    const adminPassword = 'Admin@123';
    console.log(`Checking for existing admin at ${adminEmail}...`);
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Global Org Admin',
          email: adminEmail,
          passwordHash,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
          isActive: true,
        },
      });
      console.log('✅ Created new ORG_ADMIN user');
    } else {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { role: 'ORG_ADMIN', status: 'ACTIVE', isActive: true, passwordHash },
      });
      console.log('✅ Updated existing user to ORG_ADMIN');
    }

    // 2. Create Principal Users
    const principalEmails = [
      { email: 'principal.smith@examshala.com', name: 'Dr. John Smith' },
      { email: 'principal.roy@examshala.com', name: 'Prof. Amit Roy' },
    ];

    const principals = [];
    for (const p of principalEmails) {
      let user = await prisma.user.findUnique({ where: { email: p.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            name: p.name,
            email: p.email,
            passwordHash,
            role: 'PRINCIPAL',
            status: 'ACTIVE',
            isActive: true,
          },
        });
      }
      principals.push(user);
    }
    console.log('✅ Seeded Principals');

    // 3. Create Workspaces
    const workspaceNames = ['Silicon Valley Academy', 'Nalanda Institute', 'MIT Prep Center'];
    const workspaces = [];
    for (let i = 0; i < workspaceNames.length; i++) {
      const name = workspaceNames[i];
      let ws = await prisma.workspace.findFirst({ where: { name } });
      if (!ws) {
        ws = await prisma.workspace.create({
          data: {
            id: crypto.randomUUID(),
            name,
            createdBy: admin.id,
            principalId: principals[i % principals.length]?.id || null,
          },
        });
      } else {
        ws = await prisma.workspace.update({
          where: { id: ws.id },
          data: {
            createdBy: admin.id,
            principalId: principals[i % principals.length]?.id || null,
          },
        });
      }
      workspaces.push(ws);
    }
    console.log('✅ Seeded Workspaces with Principals');

    // 4. Create Teachers and Students
    const testUsers = [
      { name: 'Sarah Connor', email: 'sarah.teacher@examshala.com', role: 'TEACHER', workspaceIdx: 0 },
      { name: 'Walter White', email: 'walter.teacher@examshala.com', role: 'TEACHER', workspaceIdx: 1 },
      { name: 'John Doe', email: 'john.student@examshala.com', role: 'STUDENT', workspaceIdx: 0 },
      { name: 'Jane Doe', email: 'jane.student@examshala.com', role: 'STUDENT', workspaceIdx: 2 },
    ];

    for (const tu of testUsers) {
      let u = await prisma.user.findUnique({ where: { email: tu.email } });
      const targetWorkspace = workspaces[tu.workspaceIdx];
      if (!u) {
        u = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            name: tu.name,
            email: tu.email,
            passwordHash,
            role: tu.role,
            status: 'ACTIVE',
            isActive: true,
            workspaceId: targetWorkspace.id,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: u.id },
          data: {
            workspaceId: targetWorkspace.id,
            role: tu.role,
          },
        });
      }
    }
    console.log('✅ Seeded Teachers and Students');

    // 5. Seed Invites
    const sampleInvites = [
      { email: 'invited.teacher1@examshala.com', role: 'TEACHER', status: 'PENDING', workspaceIdx: 0 },
      { email: 'invited.student1@examshala.com', role: 'STUDENT', status: 'PENDING', workspaceIdx: 1 },
      { email: 'accepted.principal@examshala.com', role: 'PRINCIPAL', status: 'ACCEPTED', workspaceIdx: 2 },
    ];

    await prisma.invite.deleteMany({});
    for (const inv of sampleInvites) {
      await prisma.invite.create({
        data: {
          id: crypto.randomUUID(),
          email: inv.email,
          role: inv.role,
          workspaceId: workspaces[inv.workspaceIdx].id,
          status: inv.status,
        },
      });
    }
    console.log('✅ Seeded Invitations');

    // 6. Seed System logs
    const sampleLogs = [
      { userId: admin.id, action: 'USER_CREATED', entity: 'USER', entityId: admin.id, metadata: { email: admin.email, role: 'ORG_ADMIN' } },
      { userId: admin.id, action: 'WORKSPACE_CREATED', entity: 'WORKSPACE', entityId: workspaces[0].id, metadata: { name: workspaces[0].name } },
      { userId: admin.id, action: 'WORKSPACE_CREATED', entity: 'WORKSPACE', entityId: workspaces[1].id, metadata: { name: workspaces[1].name } },
      { userId: admin.id, action: 'INVITE_SENT', entity: 'INVITE', entityId: 'invite-1', metadata: { email: 'invited.teacher1@examshala.com', role: 'TEACHER' } },
      { userId: admin.id, action: 'ROLE_ASSIGNED', entity: 'USER', entityId: principals[0].id, metadata: { role: 'PRINCIPAL', workspace: workspaces[0].name } },
    ];

    await prisma.log.deleteMany({});
    for (const log of sampleLogs) {
      await prisma.log.create({
        data: {
          id: crypto.randomUUID(),
          userId: log.userId,
          action: log.action,
          entity: log.entity,
          entityId: log.entityId,
          metadata: log.metadata,
        },
      });
    }
    console.log('✅ Seeded Audit Logs');

    console.log(`\n🎉 Seed Completed Successfully!\n`);
    console.log(`Org Admin Login Details:`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedAdmin();
