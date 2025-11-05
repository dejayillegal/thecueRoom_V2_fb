import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { notifications } from '@thecueroom/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { notificationListQuerySchema, notificationSendSchema } from '@/../../packages/shared/notificationSchemas';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { isAdmin as checkIsAdmin } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.uid;

    const { searchParams } = new URL(request.url);
    const params = {
      type: searchParams.get('type') || undefined,
      read: searchParams.get('read') || undefined,
      limit: searchParams.get('limit') || '50',
      offset: searchParams.get('offset') || '0',
      filter: searchParams.get('filter') || 'all',
    };
    
    const query = notificationListQuerySchema.parse(params);
    const db = getDbClient();
    
    let conditions = [eq(notifications.userId, userId)];
    
    if (query.type) {
      conditions.push(eq(notifications.type, query.type));
    }
    
    if (query.filter === 'unread') {
      conditions.push(eq(notifications.read, false));
    } else if (query.filter === 'read') {
      conditions.push(eq(notifications.read, true));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    const unreadResult = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ));
    
    const unreadCount = unreadResult.length;

    return NextResponse.json({
      notifications: userNotifications,
      items: userNotifications,
      data: userNotifications,
      total: userNotifications.length,
      unreadCount,
      nextCursor: null,
      hasMore: userNotifications.length === query.limit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !checkIsAdmin(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = notificationSendSchema.parse(body);
    const db = getDbClient();

    const targetUserIds: string[] = [];

    if (data.target.all) {
      return NextResponse.json(
        { error: 'Broadcast notifications not yet implemented' },
        { status: 501 }
      );
    }

    if (data.target.userIds) {
      targetUserIds.push(...data.target.userIds);
    }

    const created: any[] = [];
    for (const userId of targetUserIds) {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId,
          type: data.type,
          title: data.title,
          body: data.body,
          payload: data.payload,
          link: data.link,
          metadata: data.metadata,
        })
        .returning();

      created.push(notification);
    }

    return NextResponse.json({
      ok: true,
      message: `Sent ${created.length} notification(s)`,
      count: created.length,
      notifications: created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.uid;

    const { notificationId, markAll } = await request.json();
    const db = getDbClient();

    if (markAll) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
    } else if (notificationId) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.uid;

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    const db = getDbClient();

    if (deleteAll) {
      await db
        .delete(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, true)
        ));
      
      return NextResponse.json({ 
        ok: true,
        message: 'All read notifications deleted'
      });
    } else if (notificationId) {
      await db
        .delete(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      
      return NextResponse.json({ 
        ok: true,
        message: 'Notification deleted'
      });
    }

    return NextResponse.json(
      { error: 'Missing id or all parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
