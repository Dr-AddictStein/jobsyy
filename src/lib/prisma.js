import { PrismaClient } from '@prisma/client';

// Create a new PrismaClient instance for each request
// This ensures no caching between requests
function createPrismaClient() {
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
}

// Export a function that returns a fresh client
export const prisma = createPrismaClient();
