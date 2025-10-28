
import { getDbClient } from '@/lib/db-client';
import { aiJobs } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';
import { AIJobType, AIJobStatus } from './schemas/ai';
import { readFileSync } from 'fs';
import { join } from 'path';

const TEST_MODE = process.env.TEST_MODE === 'true';

interface QueuedJob {
  id: string;
  type: AIJobType;
  prompt: string;
  params?: Record<string, any>;
  userId: string;
  status: AIJobStatus;
  retryCount: number;
}

function generateFallbackSVG(type: AIJobType, prompt: string): string {
  const brandColor = '#D1FF3D';
  const bgColor = '#0B0B0B';
  
  const titles: Record<AIJobType, string> = {
    'cover-art': 'COVER ART',
    'meme': 'MEME',
    'epk': 'EPK',
    'avatar': 'AVATAR',
  };
  
  const title = titles[type] || 'thecueRoom';
  const truncatedPrompt = prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt;
  
  const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="${bgColor}"/>
  <text x="50%" y="35%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${brandColor}" text-anchor="middle" dy=".3em">thecueRoom</text>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" fill="${brandColor}" text-anchor="middle" dy=".3em">${title}</text>
  <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="18" fill="#666" text-anchor="middle" dy=".3em">${truncatedPrompt}</text>
</svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getTestFixture(): string {
  try {
    const fixturePath = join(process.cwd(), 'tests/fixtures/images/sample-generated.txt');
    return readFileSync(fixturePath, 'utf-8').trim();
  } catch (error) {
    console.warn('Could not read test fixture, generating fallback');
    return generateFallbackSVG('cover-art', 'Test Mode');
  }
}

class AIQueue {
  private queue: Map<string, QueuedJob> = new Map();
  private processing = false;

  async createJob(
    type: AIJobType,
    prompt: string,
    userId: string,
    params?: Record<string, any>
  ): Promise<string> {
    const db = getDbClient();
    
    const [job] = await db.insert(aiJobs).values({
      type,
      prompt,
      userId,
      params: params || null,
      status: 'pending',
      retryCount: 0,
    }).returning();

    this.queue.set(job.id, {
      id: job.id,
      type,
      prompt,
      params,
      userId,
      status: 'pending',
      retryCount: 0,
    });

    this.processQueue();

    return job.id;
  }

  async getJob(jobId: string): Promise<typeof aiJobs.$inferSelect | undefined> {
    const db = getDbClient();
    const [job] = await db.select().from(aiJobs).where(eq(aiJobs.id, jobId));
    return job;
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      for (const [jobId, job] of this.queue.entries()) {
        if (job.status !== 'pending') continue;

        await this.processJob(job);
        this.queue.delete(jobId);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processJob(job: QueuedJob) {
    const db = getDbClient();

    try {
      await db.update(aiJobs)
        .set({ status: 'processing' })
        .where(eq(aiJobs.id, job.id));

      let resultUrl: string;

      if (TEST_MODE) {
        resultUrl = getTestFixture();
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        const hasOpenAI = !!process.env.OPENAI_API_KEY;
        const hasReplicate = !!process.env.REPLICATE_API_KEY;

        if (!hasOpenAI && !hasReplicate) {
          resultUrl = generateFallbackSVG(job.type, job.prompt);
        } else {
          resultUrl = generateFallbackSVG(job.type, job.prompt);
        }
      }

      await db.update(aiJobs)
        .set({
          status: 'completed',
          resultUrl,
          completedAt: new Date(),
        })
        .where(eq(aiJobs.id, job.id));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await db.update(aiJobs)
        .set({
          status: 'failed',
          error: errorMessage,
          retryCount: job.retryCount + 1,
        })
        .where(eq(aiJobs.id, job.id));
    }
  }
}

export const aiQueue = new AIQueue();
