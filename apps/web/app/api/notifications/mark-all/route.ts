
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { notifications } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDbClient();

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
