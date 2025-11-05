import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { AIAutoGenerateInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { monthlyPlaylistWorker } from '@thecueroom/server/monthlyPlaylistWorker';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !isAdmin(session.role)) {
      const demoKey = process.env.DEMO_ADMIN_KEY;
      const authHeader = request.headers.get('Authorization');
      
      if (!demoKey || authHeader !== `Bearer ${demoKey}`) {
        return NextResponse.json(
          { ok: false, error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const validatedInput = AIAutoGenerateInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid input parameters',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const { monthOf, genrePreferences, fallbackMode } = validatedInput.data;

    console.log(`🎵 [AI Curate API] Running worker for ${monthOf}`);
    console.log(`🎭 Mode: ${process.env.MOCK_AI === 'true' ? 'MOCK' : 'REAL'}`);

    const result = await monthlyPlaylistWorker.run({
      monthOf: new Date(monthOf),
      userId: session?.uid,
      genrePreferences,
    });

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: result.message,
        details: result.error,
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      playlistId: result.playlistId,
      confidence: result.confidence,
      message: result.message,
      status: result.playlistId ? 'completed' : 'processing',
    });
  } catch (error: any) {
    console.error('[AI Curate API] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to run AI curation',
      message: error.message,
    }, { status: 500 });
  }
}
