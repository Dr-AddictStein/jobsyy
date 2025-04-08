import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch the 5 most recent login logs for this user
    const loginLogs = await prisma.loginLog.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    return NextResponse.json(loginLogs);
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return NextResponse.json({ error: 'Failed to fetch login logs' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 