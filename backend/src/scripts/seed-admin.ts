import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import crypto from 'crypto';

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@examshala.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    console.log(`Checking for existing admin at ${adminEmail}...`);
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Master Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
      },
    });

    console.log(`✅ Admin user seeded successfully!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedAdmin();
