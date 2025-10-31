import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { users } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false });
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanUsername !== username.toLowerCase()) {
      return NextResponse.json({ available: false, message: 'Username can only contain letters and numbers' });
    }

    const db = getDbClient();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, cleanUsername))
      .limit(1);

    return NextResponse.json({ available: existing.length === 0 });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ available: null }, { status: 500 });
  }
}
