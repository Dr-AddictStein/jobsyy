import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get the current user from the token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to apply for an offer' },
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

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Check if user is a performer
    if (!user || user.role.toLowerCase() !== 'performer') {
      return NextResponse.json(
        { error: 'Only performers can apply for offers' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { offerId } = body;
    
    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the offer exists
    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    });
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    // Check if the performer has already applied for this offer
    const existingApplication = await prisma.offerPerformer.findUnique({
      where: {
        offerId_performerId: {
          offerId,
          performerId: userId
        }
      }
    });
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this offer' },
        { status: 409 }
      );
    }
    
    // Create the application
    const application = await prisma.offerPerformer.create({
      data: {
        offerId,
        performerId: userId
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Successfully applied for the offer',
        application 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error applying for offer:', error);
    return NextResponse.json(
      { error: 'Failed to apply for offer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get all applications for a performer
export async function GET(request) {
  try {
    // Get the current user from the token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to view applications' },
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
    
    // Get the search params
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('offerId');
    
    // Build the where condition
    let whereCondition = { performerId: userId };
    if (offerId) {
      whereCondition.offerId = offerId;
    }
    
    // Get all applications for this performer
    const applications = await prisma.offerPerformer.findMany({
      where: whereCondition,
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            submitter: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 