import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const userId = formData.get('userId');
    const file = formData.get('file');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get file extension and create a unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get the file extension from the original filename or default to .jpg
    const originalFilename = file.name || '';
    const fileExt = originalFilename.split('.').pop() || 'jpg';
    
    // Create a unique filename using userId and timestamp
    const filename = `${userId}-${Date.now()}.${fileExt}`;
    
    // Ensure the public/uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write the file to disk
    await writeFile(join(uploadDir, filename), buffer);
    
    // Update user's image URL in the database
    const imageUrl = `/uploads/${filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl }
    });

    // Return the updated user without the password
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Image uploaded successfully',
      user: userWithoutPassword,
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 