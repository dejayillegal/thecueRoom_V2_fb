import { getDbClient } from '@thecueroom/db';
import { adminPlaylists, playlistAutoJobs, users } from '@thecueroom/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { mockAI } from './mockAiAdapter';
import type { MockAICurationResult } from './mockAiAdapter';

interface WorkerConfig {
  mockAI: boolean;
  autoPublish: boolean;
  confidenceThreshold: number;
  notifyOnComplete: boolean;
}

interface WorkerResult {
  success: boolean;
  jobId?: string;
  playlistId?: string;
  confidence?: number;
  error?: string;
  message: string;
}

export class MonthlyPlaylistWorker {
  private config: WorkerConfig;
  private db: ReturnType<typeof getDbClient>;

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      mockAI: process.env.MOCK_AI === 'true' || process.env.NODE_ENV === 'development',
      autoPublish: process.env.AUTO_PUBLISH_AI_PLAYLISTS === 'true',
      confidenceThreshold: parseInt(process.env.AI_CONFIDENCE_THRESHOLD || '70', 10),
      notifyOnComplete: process.env.NOTIFICATION_ON_PUBLISH === 'true',
      ...config,
    };
    this.db = getDbClient();
  }

  async run(input?: {
    monthOf?: Date;
    userId?: string;
    genrePreferences?: string[];
  }): Promise<WorkerResult> {
    const monthOf = input?.monthOf || new Date();
    const firstOfMonth = new Date(monthOf.getFullYear(), monthOf.getMonth(), 1);
    
    console.log('🤖 [Monthly Playlist Worker] Starting auto-curation...');
    console.log(`📅 Month: ${firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
    console.log(`🎭 Mode: ${this.config.mockAI ? 'MOCK AI' : 'REAL AI'}`);

    let jobId: string | undefined;

    try {
      const existingLive = await this.db
        .select()
        .from(adminPlaylists)
        .where(
          and(
            eq(adminPlaylists.status, 'live'),
            gte(adminPlaylists.monthOf, firstOfMonth),
            lte(adminPlaylists.monthOf, new Date(firstOfMonth.getTime() + 31 * 24 * 60 * 60 * 1000))
          )
        )
        .limit(1);

      if (existingLive.length > 0) {
        return {
          success: false,
          message: `Playlist already exists for this month (ID: ${existingLive[0].id})`,
        };
      }

      const [job] = await this.db
        .insert(playlistAutoJobs)
        .values({
          jobType: 'fallback_generation',
          status: 'processing',
          inputData: {
            monthOf: firstOfMonth.toISOString(),
            genrePreferences: input?.genrePreferences || [],
            confidenceThreshold: this.config.confidenceThreshold,
          },
          startedAt: new Date(),
          createdBy: input?.userId || null,
        })
        .returning();

      jobId = job.id;
      console.log(`✅ Created job: ${jobId}`);

      const aiResult = await this.generatePlaylist({
        monthOf: firstOfMonth,
        genrePreferences: input?.genrePreferences,
      });

      if (!aiResult.ok) {
        await this.db
          .update(playlistAutoJobs)
          .set({
            status: 'failed',
            errorMessage: 'AI generation failed',
            finishedAt: new Date(),
          })
          .where(eq(playlistAutoJobs.id, jobId));

        return {
          success: false,
          jobId,
          message: 'AI generation failed',
          error: 'AI generation returned error',
        };
      }

      console.log(`🎵 Generated playlist: "${aiResult.title}" (Confidence: ${aiResult.confidence}%)`);

      const [playlist] = await this.db
        .insert(adminPlaylists)
        .values({
          title: aiResult.title,
          description: aiResult.description,
          platform: aiResult.platform,
          platformId: aiResult.platformId,
          embedUrl: aiResult.embedUrl,
          coverImage: aiResult.coverImage,
          monthOf: firstOfMonth,
          trackCount: aiResult.trackCount,
          autoCurated: true,
          aiConfidenceScore: aiResult.confidence,
          status: this.shouldAutoPublish(aiResult.confidence) ? 'live' : 'draft',
          publishedAt: this.shouldAutoPublish(aiResult.confidence) ? new Date() : null,
          metadata: {
            aiRationale: aiResult.rationale,
            generatedAt: aiResult.generatedAt,
            items: aiResult.items,
          },
        })
        .returning();

      await this.db
        .update(playlistAutoJobs)
        .set({
          status: 'completed',
          playlistId: playlist.id,
          resultData: aiResult,
          confidenceScore: aiResult.confidence,
          finishedAt: new Date(),
        })
        .where(eq(playlistAutoJobs.id, jobId));

      const status = playlist.status === 'live' ? 'published automatically' : 'saved as draft';
      console.log(`✅ Playlist ${status}: ${playlist.id}`);

      return {
        success: true,
        jobId,
        playlistId: playlist.id,
        confidence: aiResult.confidence,
        message: `Playlist ${status} successfully`,
      };

    } catch (error: any) {
      console.error('❌ Worker error:', error);

      if (jobId) {
        await this.db
          .update(playlistAutoJobs)
          .set({
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
            finishedAt: new Date(),
          })
          .where(eq(playlistAutoJobs.id, jobId));
      }

      return {
        success: false,
        jobId,
        message: 'Worker execution failed',
        error: error.message || 'Unknown error',
      };
    }
  }

  private async generatePlaylist(input: {
    monthOf: Date;
    genrePreferences?: string[];
  }): Promise<MockAICurationResult> {
    if (this.config.mockAI) {
      return await mockAI.generateMonthlyPlaylist({
        monthOf: input.monthOf,
        historyMonths: 6,
        genrePreferences: input.genrePreferences,
        minConfidence: this.config.confidenceThreshold,
      });
    }

    throw new Error('Real AI implementation not available. Set MOCK_AI=true to use mock mode.');
  }

  private shouldAutoPublish(confidence: number): boolean {
    return this.config.autoPublish && confidence >= this.config.confidenceThreshold;
  }

  async getStatus(jobId: string): Promise<any> {
    const [job] = await this.db
      .select()
      .from(playlistAutoJobs)
      .where(eq(playlistAutoJobs.id, jobId))
      .limit(1);

    if (!job) {
      return { ok: false, error: 'Job not found' };
    }

    return {
      ok: true,
      job: {
        id: job.id,
        status: job.status,
        jobType: job.jobType,
        playlistId: job.playlistId,
        confidence: job.confidenceScore,
        error: job.errorMessage,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        createdAt: job.createdAt,
      },
    };
  }

  async listRecentJobs(limit: number = 10): Promise<any> {
    const jobs = await this.db
      .select()
      .from(playlistAutoJobs)
      .orderBy(desc(playlistAutoJobs.createdAt))
      .limit(limit);

    return {
      ok: true,
      jobs: jobs.map((job: any) => ({
        id: job.id,
        status: job.status,
        jobType: job.jobType,
        playlistId: job.playlistId,
        confidence: job.confidenceScore,
        error: job.errorMessage,
        createdAt: job.createdAt,
        finishedAt: job.finishedAt,
      })),
    };
  }
}

export const monthlyPlaylistWorker = new MonthlyPlaylistWorker();

if (require.main === module) {
  console.log('🚀 Running Monthly Playlist Worker (CLI mode)...\n');
  
  monthlyPlaylistWorker.run()
    .then((result) => {
      console.log('\n📊 Worker Result:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}
