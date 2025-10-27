
// src/app/api/session/logout/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { serializeCookie } from '@/lib/cookies';

export async function POST(_req: NextRequest) {
  try {
    const cookie = serializeCookie('thecue_session', '', {
      maxAge: -1, // Expire immediately
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const res = NextResponse.json({ ok: true });
    res.headers.set('Set-Cookie', cookie);
    if (process.env.NODE_ENV === 'development') {
        console.log('logout route: cleared session cookie');
    }
    return res;
  } catch (err: any) {
    console.error('logout route error:', err?.message ?? err);
    return NextResponse.json({ ok: false, message: err?.message ?? 'Server error during logout.' }, { status: 500 });
  }
}
