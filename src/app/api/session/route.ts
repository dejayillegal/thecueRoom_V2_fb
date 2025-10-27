
// src/app/api/session/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { serializeCookie } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idToken = typeof body?.idToken === 'string' ? body.idToken : null;

    if (!idToken) {
      return NextResponse.json({ ok: false, message: 'Missing idToken' }, { status: 400 });
    }

    if (!adminAuth) {
      console.error('session route error: adminAuth not initialized. Check server logs for firebaseAdmin init errors.');
      return NextResponse.json({ ok: false, message: 'Server not configured (adminAuth missing)' }, { status: 500 });
    }

    // The `true` checks for signature validity without checking revocation, which is the
    // recommended, high-performance practice for session cookies.
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    
    if (!decoded) {
      return NextResponse.json({ ok: false, message: 'Invalid token' }, { status: 401 });
    }

    const ttl = Number(process.env.SESSION_COOKIE_TTL_SECONDS ?? 1200);
    const cookie = serializeCookie('thecue_session', idToken, {
      maxAge: ttl,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const res = NextResponse.json({ ok: true, uid: decoded.uid });
    // use set rather than append to avoid duplicates in dev tooling
    res.headers.set('Set-Cookie', cookie);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ session route: Successfully created session cookie for uid=${decoded.uid}`);
    }
    
    return res;
  } catch (err: any) {
    let errorMessage = 'Server error during session creation.';
    if(err.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase token has expired. Please sign in again.';
    } else if (err.code === 'auth/argument-error') {
        errorMessage = 'Firebase token is invalid. Please sign in again.';
    } else if (err.code === 'auth/id-token-revoked') {
        errorMessage = 'Your session has been revoked. Please sign in again.';
    }
    
    console.error('💥 session route error:', err.code, err?.message ?? err);
    return NextResponse.json({ ok: false, message: errorMessage }, { status: 500 });
  }
}
