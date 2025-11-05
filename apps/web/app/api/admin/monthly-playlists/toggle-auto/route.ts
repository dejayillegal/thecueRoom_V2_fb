
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { ToggleAutoFallbackInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { getMonthlyPlaylistWorker } from '@/../../packages/workers/monthlyPlaylistWorker';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const input = ToggleAutoFallbackInputSchema.parse(body);

    // Update worker configuration
    const worker = getMonthlyPlaylistWorker();
    worker.updateConfig({
      enabled: input.enabled,
      confidenceThreshold: input.confidenceThreshold || 70,
      autoPublish: input.autoPublishOnConfidence || false,
    });

    return NextResponse.json({
      ok: true,
      message: input.enabled
        ? 'AI auto-curation enabled'
        : 'AI auto-curation disabled',
      config: {
        enabled: input.enabled,
        confidenceThreshold: input.confidenceThreshold,
        autoPublish: input.autoPublishOnConfidence,
      },
    });
  } catch (error) {
    console.error('Toggle auto-curation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to toggle auto-curation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const worker = getMonthlyPlaylistWorker();
    
    return NextResponse.json({
      ok: true,
      enabled: true, // Worker config would be stored in DB in production
    });
  } catch (error) {
    return NextResponse.json({ ok: true, enabled: false });
  }
}
