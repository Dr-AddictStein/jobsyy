import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }
    
    const cookieStore = await cookies();
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
    
    const { performerId } = await request.json();
    
    if (!performerId) {
      return NextResponse.json(
        { error: 'Performer ID is required' },
        { status: 400 }
      );
    }
    
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
    
    if (offer.submitterId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to accept performers for this offer' },
        { status: 403 }
      );
    }
    
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
    
    await prisma.offerPerformer.update({
      where: { id: performer.id },
      data: { isAccepted: true }
    });
    
    await prisma.offer.update({
      where: { id },
      data: { status: 'RUNNING' }
    });
    
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