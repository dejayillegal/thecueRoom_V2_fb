
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Delete the session cookie
    cookieStore.delete('session');
    
    return NextResponse.json({ 
      success: true,
      message: 'Signed out successfully' 
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { message: 'Sign out failed' },
      { status: 500 }
    );
  }
}
