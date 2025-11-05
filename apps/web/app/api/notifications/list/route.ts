
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { notifications } from '@thecueroom/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, unread, verification, promo
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDbClient();
    
    let conditions = [eq(notifications.userId, userId)];
    
    if (filter === 'unread') {
      conditions.push(eq(notifications.read, false));
    } else if (filter === 'verification') {
      conditions.push(eq(notifications.type, 'verification_approved'));
    } else if (filter === 'promo') {
      conditions.push(eq(notifications.type, 'promo_generated'));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    const unreadCount = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadCount.length,
    });
  } catch (error) {
    console.error('Notifications list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
