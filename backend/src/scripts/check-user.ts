import 'dotenv/config';
import prisma from '../lib/prisma';

async function check() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mode: true,
      workspaceId: true,
    }
  });
  console.log('--- ALL USERS IN DATABASE ---');
  console.log(JSON.stringify(users, null, 2));
}

check();
