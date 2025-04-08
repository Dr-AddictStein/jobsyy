import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get the current user from the token
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to create an offer' },
        { status: 401 }
      );
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { title, description } = await request.json();
    
    // Validate the request
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        submitterId: userId,
        // We're not adding performers at creation time
      },
    });

    return NextResponse.json({ offer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request) {
  try {
    // Get the current user from the token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to view offers' },
        { status: 401 }
      );
    }

    let userId;
    let userRole;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      userRole = decoded.role;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'submitter';
    
    let offers = [];
    
    if (role === 'submitter') {
      // Get offers where the current user is the submitter
      offers = await prisma.offer.findMany({
        where: {
          submitterId: userId,
        },
        include: {
          submitter: {
            select: {
              id: true,
              name: true,
            },
          },
          performers: {
            include: {
              performer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else if (role === 'performer') {
      // Get offers where the current user is a performer
      offers = await prisma.offer.findMany({});
    } else if (role === 'all') {
      // Get ALL offers for performers to browse
      offers = await prisma.offer.findMany({});
    }
    
    return NextResponse.json({ offers });
  } catch (error) {
    console.error('Error getting offers:', error);
    return NextResponse.json(
      { error: 'Failed to get offers' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 