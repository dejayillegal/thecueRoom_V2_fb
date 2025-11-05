
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return a simple status
    // This will be enhanced when AI worker is implemented
    const enabled = process.env.FEATURE_MONTHLY_AI_FALLBACK === 'true';

    return NextResponse.json({
      ok: true,
      enabled,
    });
  } catch (error) {
    console.error('Error fetching auto-curation status:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
