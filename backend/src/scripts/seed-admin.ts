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
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Clean up existing seeded users to ensure they get recreated with fancy 8-char IDs
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            adminEmail,
            'principal.smith@examshala.com',
            'principal.roy@examshala.com',
            'sarah.teacher@examshala.com',
            'walter.teacher@examshala.com',
            'john.student@examshala.com',
            'jane.student@examshala.com',
          ],
        },
      },
    });

    console.log(`Creating admin at ${adminEmail}...`);
    // Seed Org Admin with a fixed brand-consistent 8-character ID conforming to 'AD-XXXXX' format
    const admin = await prisma.user.create({
      data: {
        id: 'AD-ADMIN',
        name: 'Global Org Admin',
        email: adminEmail,
        passwordHash,
        role: 'ORG_ADMIN',
        status: 'ACTIVE',
        isActive: true,
      },
    });
    console.log('✅ Seeded ORG_ADMIN');

    // 2. Create Principal Users
    // Seed Principals with custom fixed 8-character mnemonic IDs (e.g. 'PR-SMITH', 'PR-ROYAL')
    const principalEmails = [
      { email: 'principal.smith@examshala.com', name: 'Dr. John Smith', id: 'PR-SMITH' },
      { email: 'principal.roy@examshala.com', name: 'Prof. Amit Roy', id: 'PR-ROYAL' },
    ];

    const principals = [];
    for (const p of principalEmails) {
      const user = await prisma.user.create({
        data: {
          id: p.id,
          name: p.name,
          email: p.email,
          passwordHash,
          role: 'PRINCIPAL',
          status: 'ACTIVE',
          isActive: true,
        },
      });
      principals.push(user);
    }
    console.log('✅ Seeded Principals');

    // 3. Create Workspaces
    // Seed Workspaces using fixed 8-character brand-consistent IDs starting with 'ES-'
    const workspaceNames = ['Silicon Valley Academy', 'Nalanda Institute', 'MIT Prep Center'];
    const workspaceIds = ['ES-SILIC', 'ES-NALAN', 'ES-MITPC'];
    const workspaces = [];
    for (let i = 0; i < workspaceNames.length; i++) {
      const name = workspaceNames[i];
      const fixedId = workspaceIds[i];
      
      // Delete any existing workspace with this name to ensure clean seed with new fancy ID
      await prisma.workspace.deleteMany({ where: { name } });

      const ws = await prisma.workspace.create({
        data: {
          id: fixedId,
          name,
          createdBy: admin.id,
          principalId: principals[i % principals.length]?.id || null,
        },
      });
      workspaces.push(ws);
    }
    console.log('✅ Seeded Workspaces with Principals');

    // 4. Create Teachers and Students
    // Seed teachers ('TR-XXXXX') and students ('ST-XXXXX') with custom readable 8-character IDs
    const testUsers = [
      { name: 'Sarah Connor', email: 'sarah.teacher@examshala.com', role: 'TEACHER', workspaceIdx: 0, id: 'TR-SARAH' },
      { name: 'Walter White', email: 'walter.teacher@examshala.com', role: 'TEACHER', workspaceIdx: 1, id: 'TR-WALT2' },
      { name: 'John Doe', email: 'john.student@examshala.com', role: 'STUDENT', workspaceIdx: 0, id: 'ST-JOHN1' },
      { name: 'Jane Doe', email: 'jane.student@examshala.com', role: 'STUDENT', workspaceIdx: 2, id: 'ST-JANE1' },
    ];

    for (const tu of testUsers) {
      const targetWorkspace = workspaces[tu.workspaceIdx];
      await prisma.user.create({
        data: {
          id: tu.id,
          name: tu.name,
          email: tu.email,
          passwordHash,
          role: tu.role,
          status: 'ACTIVE',
          isActive: true,
          workspaceId: targetWorkspace.id,
        },
      });
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
