
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Google sign-in is not available' },
    { status: 501 }
  );
}
