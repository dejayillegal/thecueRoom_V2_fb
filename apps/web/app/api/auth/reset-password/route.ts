import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Password reset is not available. Please contact an administrator.' },
    { status: 501 }
  );
}