import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function PUT(req) {
  try {
    const userData = await req.json();
    const { id, name, email, dateOfBirth, bio, phone, password } = userData;

    // Validate required fields
    if (!id) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailExists) {
        return Response.json({ error: "Email is already taken" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      dateOfBirth: dateOfBirth || null,
      bio: bio || null,
      phone: phone || null
    };

    // Hash password if provided
    if (password) {
      updateData.password = await hash(password, 10);
    }

    // Update user with robust error handling
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      console.error("Prisma update error:", error);
      return Response.json({ 
        error: "Database update failed", 
        details: error.message 
      }, { status: 500 });
    }

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return Response.json({ 
      success: true,
      message: "User updated successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return Response.json({ 
      error: "Failed to update user",
      details: error.message
    }, { status: 500 });
  }
} 