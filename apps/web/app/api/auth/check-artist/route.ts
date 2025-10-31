
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artistName = searchParams.get('name');

    if (!artistName || artistName.length < 2) {
      return NextResponse.json({ available: false });
    }

    const db = getDbClient();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.artistName, artistName))
      .limit(1);

    return NextResponse.json({ available: existing.length === 0 });
  } catch (error) {
    console.error('Error checking artist name:', error);
    return NextResponse.json({ available: null }, { status: 500 });
  }
}
