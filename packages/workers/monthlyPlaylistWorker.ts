
import { getDbClient } from '@thecueroom/db/client';
import { adminPlaylists, playlistAutoJobs } from '@thecueroom/db/schema';
import { eq, and, lte, isNull } from 'drizzle-orm';

const POLL_INTERVAL = 60000; // 1 minute
const AI_FALLBACK_WINDOW = 24 * 60 * 60 * 1000; // 24 hours before month start

interface AIFallbackConfig {
  enabled: boolean;
  confidenceThreshold: number;
  autoPublish: boolean;
}

export class MonthlyPlaylistWorker {
  private running = false;
  private config: AIFallbackConfig = {
    enabled: true,
    confidenceThreshold: 70,
    autoPublish: false,
  };

  async start() {
    this.running = true;
    console.log('[MonthlyPlaylistWorker] Starting...');
    
    while (this.running) {
      try {
        await this.processScheduledPublications();
        await this.checkAIFallback();
      } catch (error) {
        console.error('[MonthlyPlaylistWorker] Error:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  stop() {
    this.running = false;
    console.log('[MonthlyPlaylistWorker] Stopped');
  }

  private async processScheduledPublications() {
    const db = getDbClient();
    const now = new Date();

    // Find playlists scheduled for publication
    const scheduled = await db
      .select()
      .from(adminPlaylists)
      .where(
        and(
          eq(adminPlaylists.status, 'scheduled'),
          lte(adminPlaylists.scheduledAt, now)
        )
      );

    for (const playlist of scheduled) {
      try {
        console.log(`[MonthlyPlaylistWorker] Publishing scheduled playlist: ${playlist.id}`);
        
        // Archive previous live playlist
        await db
          .update(adminPlaylists)
          .set({ status: 'archived' })
          .where(eq(adminPlaylists.status, 'live'));

        // Publish scheduled playlist
        await db
          .update(adminPlaylists)
          .set({
            status: 'live',
            publishedAt: now,
            scheduledAt: null,
          })
          .where(eq(adminPlaylists.id, playlist.id));

        console.log(`[MonthlyPlaylistWorker] Published: ${playlist.id}`);
      } catch (error) {
        console.error(`[MonthlyPlaylistWorker] Failed to publish ${playlist.id}:`, error);
      }
    }
  }

  private async checkAIFallback() {
    if (!this.config.enabled) return;

    const db = getDbClient();
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const fallbackWindow = new Date(nextMonth.getTime() - AI_FALLBACK_WINDOW);

    // Check if we're in the fallback window and no playlist exists for next month
    if (now < fallbackWindow) return;

    const existingForNextMonth = await db
      .select()
      .from(adminPlaylists)
      .where(
        and(
          eq(adminPlaylists.monthOf, nextMonth),
          isNull(adminPlaylists.deletedAt)
        )
      )
      .limit(1);

    if (existingForNextMonth.length > 0) return;

    // Check if AI job already exists
    const existingJob = await db
      .select()
      .from(playlistAutoJobs)
      .where(
        and(
          eq(playlistAutoJobs.jobType, 'ai_fallback_generation'),
          eq(playlistAutoJobs.status, 'pending')
        )
      )
      .limit(1);

    if (existingJob.length > 0) return;

    // Create AI fallback job
    console.log('[MonthlyPlaylistWorker] Creating AI fallback job for next month');
    
    await db.insert(playlistAutoJobs).values({
      jobType: 'ai_fallback_generation',
      status: 'pending',
      inputData: {
        monthOf: nextMonth.toISOString(),
        reason: 'auto_fallback',
        threshold: this.config.confidenceThreshold,
      },
      createdAt: now,
    });

    // Trigger AI generation
    await this.triggerAIGeneration(nextMonth);
  }

  private async triggerAIGeneration(monthOf: Date) {
    try {
      console.log('[MonthlyPlaylistWorker] Triggering AI generation for', monthOf);
      
      // Call AI generation endpoint
      const response = await fetch(`${process.env.BASE_URL || 'http://localhost:5000'}/api/admin/monthly-playlists/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthOf: monthOf.toISOString(),
          autoPublish: this.config.autoPublish,
          confidenceThreshold: this.config.confidenceThreshold,
        }),
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log('[MonthlyPlaylistWorker] AI generation job created:', data.jobId);
      } else {
        console.error('[MonthlyPlaylistWorker] AI generation failed:', data.error);
      }
    } catch (error) {
      console.error('[MonthlyPlaylistWorker] Failed to trigger AI generation:', error);
    }
  }

  updateConfig(config: Partial<AIFallbackConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[MonthlyPlaylistWorker] Config updated:', this.config);
  }
}

// Singleton instance
let workerInstance: MonthlyPlaylistWorker | null = null;

export function getMonthlyPlaylistWorker() {
  if (!workerInstance) {
    workerInstance = new MonthlyPlaylistWorker();
  }
  return workerInstance;
}

// Auto-start if run directly
if (require.main === module) {
  const worker = getMonthlyPlaylistWorker();
  worker.start().catch(console.error);

  process.on('SIGTERM', () => worker.stop());
  process.on('SIGINT', () => worker.stop());
}
