
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 503 }
      );
    }

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create the user
    const user = await adminAuth.createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Create custom token
    const customToken = await adminAuth.createCustomToken(user.uid);

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        uid: user.uid,
        email: user.email,
      }
    });

    // Set session cookie
    response.cookies.set('session', customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
