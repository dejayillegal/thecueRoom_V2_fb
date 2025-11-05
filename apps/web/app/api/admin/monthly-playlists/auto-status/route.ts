
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDbClient();
    const [config] = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.id, 'auto-config'))
      .limit(1);

    return NextResponse.json({
      ok: true,
      autoEnabled: config?.autoCurated ?? false,
    });
  } catch (error) {
    console.error('Auto-status fetch error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch auto-curation status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { enabled } = await request.json();
    const db = getDbClient();

    await db
      .insert(adminPlaylists)
      .values({
        id: 'auto-config',
        autoCurated: enabled,
        title: 'Auto-curation Config',
        platform: 'spotify',
        status: 'draft',
      })
      .onConflictDoUpdate({
        target: adminPlaylists.id,
        set: { autoCurated: enabled },
      });

    return NextResponse.json({
      ok: true,
      autoEnabled: enabled,
    });
  } catch (error) {
    console.error('Auto-status toggle error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to toggle auto-curation' },
      { status: 500 }
    );
  }
}
