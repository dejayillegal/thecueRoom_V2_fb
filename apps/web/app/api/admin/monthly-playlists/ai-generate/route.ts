
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists, playlistAutoJobs } from '@thecueroom/db/schema';
import { AIAutoGenerateInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const input = AIAutoGenerateInputSchema.parse(body);

    const db = getDbClient();

    // Create AI generation job
    const [job] = await db
      .insert(playlistAutoJobs)
      .values({
        jobType: 'ai_music_curation',
        status: 'pending',
        inputData: {
          monthOf: input.monthOf,
          historyMonths: input.historyMonths || 6,
          genrePreferences: input.genrePreferences || [],
          minConfidence: input.minConfidence || 70,
          fallbackMode: input.fallbackMode ?? true,
        },
        createdBy: session.id,
        createdAt: new Date(),
      })
      .returning();

    // Start AI curation process
    setTimeout(() => processAICuration(job.id), 100);

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      status: 'pending',
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to start AI generation' },
      { status: 500 }
    );
  }
}

async function processAICuration(jobId: string) {
  const db = getDbClient();

  try {
    // Update job status
    await db
      .update(playlistAutoJobs)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(playlistAutoJobs.id, jobId));

    // Get job details
    const [job] = await db
      .select()
      .from(playlistAutoJobs)
      .where(eq(playlistAutoJobs.id, jobId));

    if (!job) throw new Error('Job not found');

    const inputData = job.inputData as any;

    // Analyze historical playlists
    const historicalPlaylists = await db
      .select()
      .from(adminPlaylists)
      .where(eq(adminPlaylists.status, 'live'))
      .orderBy(desc(adminPlaylists.publishedAt))
      .limit(inputData.historyMonths || 6);

    // AI Music Selection Logic
    const selectedTracks = await selectTracksWithAI(
      historicalPlaylists,
      inputData.genrePreferences || [],
      inputData.minConfidence || 70
    );

    const confidenceScore = calculateConfidenceScore(selectedTracks);

    // Create playlist metadata
    const monthDate = new Date(inputData.monthOf);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // In fallback mode, create a draft playlist
    if (inputData.fallbackMode) {
      const [playlist] = await db
        .insert(adminPlaylists)
        .values({
          title: `${monthName} AI Curated Selection`,
          description: `AI-generated monthly playlist with ${selectedTracks.length} tracks`,
          platform: 'spotify', // Default to Spotify
          platformId: '', // Will be set when manually published
          embedUrl: '',
          monthOf: monthDate,
          status: 'draft',
          autoCurated: true,
          aiConfidenceScore: confidenceScore,
          metadata: {
            tracks: selectedTracks,
            generatedBy: 'ai',
            generatedAt: new Date().toISOString(),
          },
          createdAt: new Date(),
        })
        .returning();

      // Update job with success
      await db
        .update(playlistAutoJobs)
        .set({
          status: 'completed',
          playlistId: playlist.id,
          confidenceScore,
          resultData: {
            playlistId: playlist.id,
            trackCount: selectedTracks.length,
            confidenceScore,
          },
          finishedAt: new Date(),
        })
        .where(eq(playlistAutoJobs.id, jobId));

      console.log(`[AI Curation] Created draft playlist: ${playlist.id}`);
    }
  } catch (error) {
    console.error('[AI Curation] Error:', error);
    
    await db
      .update(playlistAutoJobs)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        finishedAt: new Date(),
      })
      .where(eq(playlistAutoJobs.id, jobId));
  }
}

async function selectTracksWithAI(
  historicalPlaylists: any[],
  genrePreferences: string[],
  minConfidence: number
): Promise<any[]> {
  // Mock AI selection for now - in production, integrate with OpenAI or similar
  const mockTracks = [
    {
      title: 'Underground Techno Track 1',
      artist: 'AI Selected Artist',
      platform: 'spotify',
      trackId: 'mock-track-1',
      aiScore: 85,
      aiRationale: 'Matches historical patterns and genre preferences',
    },
    {
      title: 'Deep House Selection',
      artist: 'Curated Artist',
      platform: 'spotify',
      trackId: 'mock-track-2',
      aiScore: 78,
      aiRationale: 'High engagement in similar playlists',
    },
  ];

  // Filter by confidence threshold
  return mockTracks.filter((track) => track.aiScore >= minConfidence);
}

function calculateConfidenceScore(tracks: any[]): number {
  if (tracks.length === 0) return 0;
  const avgScore = tracks.reduce((sum, t) => sum + (t.aiScore || 0), 0) / tracks.length;
  return Math.round(avgScore * 100) / 100;
}
