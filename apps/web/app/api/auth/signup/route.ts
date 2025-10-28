import { NextResponse } from 'next/server';

export async function POST() {
  // For now, signup is disabled - only admin users can sign in
  return NextResponse.json(
    { message: 'Signup is currently invite-only' },
    { status: 403 }
  );
}