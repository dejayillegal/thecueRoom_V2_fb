
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ 
      user: {
        uid: session.uid,
        email: session.email,
        role: session.role
      }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}
