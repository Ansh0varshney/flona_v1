const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Adding flona_name column to User table...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "flona_name" TEXT UNIQUE'
    );
    console.log('✓ Column added successfully');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Column already exists');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
