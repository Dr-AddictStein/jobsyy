import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      return NextResponse.json(
        { error: 'OfferPerformer ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user from the token
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'You must be logged in to mark a task as complete' },
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
    
    // Parse the request body to determine which field to update
    const { performerCompletedTask, submitterCompletedTask } = await request.json();
    
    // Find the offer performer record
    const offerPerformer = await prisma.offerPerformer.findUnique({
      where: { id },
      include: {
        offer: {
          select: {
            id: true,
            submitterId: true
          }
        }
      }
    });
    
    if (!offerPerformer) {
      return NextResponse.json(
        { error: 'Offer performer record not found' },
        { status: 404 }
      );
    }
    
    // Verify that the user is either the performer or the submitter
    const isPerformer = offerPerformer.performerId === userId;
    const isSubmitter = offerPerformer.offer.submitterId === userId;
    
    if (!isPerformer && !isSubmitter) {
      return NextResponse.json(
        { error: 'You are not authorized to update this record' },
        { status: 403 }
      );
    }
    
    // Only allow performers to update performerCompletedTask
    // and submitters to update submitterCompletedTask
    let updateData = {};
    
    if (isPerformer && performerCompletedTask !== undefined) {
      updateData.performerCompletedTask = performerCompletedTask;
    } else if (isSubmitter && submitterCompletedTask !== undefined) {
      updateData.submitterCompletedTask = submitterCompletedTask;
    } else {
      return NextResponse.json(
        { error: 'Invalid update request' },
        { status: 400 }
      );
    }
    
    // Update the offer performer record
    const updatedOfferPerformer = await prisma.offerPerformer.update({
      where: { id },
      data: updateData
    });
    
    // Check if both performer and submitter have marked the task as done
    // If so, update the offer status to DONE
    if (updatedOfferPerformer.performerCompletedTask && updatedOfferPerformer.submitterCompletedTask) {
      await prisma.offer.update({
        where: { id: offerPerformer.offerId },
        data: { status: 'DONE' }
      });
    }
    
    return NextResponse.json({
      message: 'Task status updated successfully',
      offerPerformer: updatedOfferPerformer
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 