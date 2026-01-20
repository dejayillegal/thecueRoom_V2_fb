import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getIngestionConfig } from '@thecueroom/db/ingestion';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getIngestionConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { db } from '@thecueroom/db';
import { feedIngestionConfig } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, intervalMinutes, forceNextRun } = body;

    if (intervalMinutes !== undefined && (intervalMinutes < 5 || intervalMinutes > 1440)) {
      return NextResponse.json({ error: 'Interval must be between 5 and 1440 minutes' }, { status: 400 });
    }

    const currentConfig = await getIngestionConfig();
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedByAdminId: session.user.id,
    };

    if (enabled !== undefined) updateData.enabled = enabled;
    if (intervalMinutes !== undefined) updateData.intervalMinutes = intervalMinutes;
    
    if (forceNextRun || intervalMinutes !== undefined) {
      updateData.nextRunAt = new Date();
    }

    const [updated] = await db
      .update(feedIngestionConfig)
      .set(updateData)
      .where(eq(feedIngestionConfig.id, currentConfig.id))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
