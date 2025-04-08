import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
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
        { error: 'You must be logged in to delete an offer' },
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
        { error: 'You are not authorized to delete this offer' },
        { status: 403 }
      );
    }
    
    // Delete all related OfferPerformer records first
    await prisma.offerPerformer.deleteMany({
      where: { offerId: id },
    });
    
    // Delete the offer
    await prisma.offer.delete({
      where: { id },
    });
    
    return NextResponse.json(
      { message: 'Offer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request, { params }) {
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
        { error: 'You must be logged in to view an offer' },
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
    
    // Find the offer
    const offer = await prisma.offer.findUnique({
      where: { id },
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
    });
    
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Error getting offer:', error);
    return NextResponse.json(
      { error: 'Failed to get offer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 