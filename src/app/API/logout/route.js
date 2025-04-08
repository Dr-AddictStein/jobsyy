import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the user cookie
  await cookies().delete('user');
  
  return NextResponse.json({ success: true });
}
