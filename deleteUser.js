const { PrismaClient } = require('@prisma/client');

async function deleteUser() {
  const prisma = new PrismaClient();
  try {
    console.log('Connecting to database...');
    
    // Delete the specific user
    const deletedUser = await prisma.$executeRaw`DELETE FROM "User" WHERE email = 'codingjedi048@gmail.com' RETURNING *`;
    
    console.log('Deleted user:', deletedUser);
    console.log('User deletion completed');
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser(); 