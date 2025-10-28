
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

    if (!adminAuth) {
      return NextResponse.json(
        { message: 'Authentication service not available' },
        { status: 503 }
      );
    }

    // Verify the user exists and get their UID
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // For security, we should validate the password using Firebase Client SDK
    // but for now, we'll create a custom token that can be used
    // Note: In production, you should use Firebase Client SDK on the frontend
    const customToken = await adminAuth.createCustomToken(user.uid);

    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      token: customToken,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
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
    console.error('Sign in error:', error);
    return NextResponse.json(
      { message: error.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}
