import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    let email, password;
    
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    await setSession(user);

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}