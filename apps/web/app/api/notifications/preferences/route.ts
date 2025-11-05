import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@thecueroom/db/client';
import { notificationPreferences } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { notificationPreferencesSchema } from '@/../../packages/shared/notificationSchemas';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.uid;

    const db = getDbClient();
    
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!prefs) {
      const defaultPrefs = {
        userId,
        emailDigest: true,
        inApp: true,
        push: false,
      };
      
      const [created] = await db
        .insert(notificationPreferences)
        .values(defaultPrefs)
        .returning();
      
      return NextResponse.json({ preferences: created });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.uid;

    const body = await request.json();
    const data = notificationPreferencesSchema.parse(body);
    const db = getDbClient();

    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let updated;
    if (existing) {
      [updated] = await db
        .update(notificationPreferences)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    } else {
      [updated] = await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...data,
        })
        .returning();
    }

    return NextResponse.json({
      ok: true,
      preferences: updated,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Notification preferences PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
