import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();

    console.log('Registration attempt:', { name, email, role });

    if (!name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'All fields required' }), { status: 400 });
    }

    console.log('Checking if email exists in database:', email);
    // Force prisma to actually execute a direct query
    const exists = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email}`;
    console.log('Database response:', exists);
    
    if (exists && exists.length > 0) {
      return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 400 });
    }

    console.log('Creating new user');
    const hashed = await hash(password, 10);
    await prisma.user.create({ data: { name, email, password: hashed, role } });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (e) {
    console.error('Registration error:', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
