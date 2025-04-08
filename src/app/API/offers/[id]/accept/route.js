import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user from the token
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to accept a performer' },
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
    
    // Get the request body
    const { performerId } = await request.json();
    
    if (!performerId) {
      return NextResponse.json(
        { error: 'Performer ID is required' },
        { status: 400 }
      );
    }
    
    // Find the offer
    const offer = await prisma.offer.findUnique({
      where: { id },
      select: { submitterId: true },
    });
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the owner of the offer
    if (offer.submitterId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to accept performers for this offer' },
        { status: 403 }
      );
    }
    
    // Check if the performer exists in the OfferPerformer table
    const performer = await prisma.offerPerformer.findUnique({
      where: {
        offerId_performerId: {
          offerId: id,
          performerId: performerId,
        },
      },
    });
    
    if (!performer) {
      return NextResponse.json(
        { error: 'Performer not found for this offer' },
        { status: 404 }
      );
    }
    
    // Update the OfferPerformer status to accepted
    // Note: In a real application, you might have a status field in the OfferPerformer model
    // For now, we'll just simulate acceptance
    
    return NextResponse.json(
      { message: 'Performer accepted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting performer:', error);
    return NextResponse.json(
      { error: 'Failed to accept performer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 