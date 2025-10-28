
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
        .set({ status: 'processing', progress: 10 })
        .where(eq(aiJobs.id, job.id));

      let resultUrl: string;

      if (TEST_MODE) {
        resultUrl = getTestFixture();
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        const hasHuggingFace = !!process.env.HUGGINGFACE_KEY;

        if (hasHuggingFace) {
          try {
            resultUrl = await this.generateWithHuggingFace(job.prompt, job.params);
          } catch (hfError) {
            console.warn('HuggingFace generation failed, using fallback:', hfError);
            resultUrl = generateFallbackSVG(job.type, job.prompt);
          }
        } else {
          console.log('No HuggingFace API key, using free fallback generator');
          resultUrl = generateFallbackSVG(job.type, job.prompt);
        }
      }

      await db.update(aiJobs)
        .set({
          status: 'completed',
          resultUrl,
          progress: 100,
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

  private async generateWithHuggingFace(prompt: string, params?: Record<string, any>): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_KEY not configured');
    }

    // Use Stable Diffusion XL model from HuggingFace
    const modelId = 'stabilityai/stable-diffusion-xl-base-1.0';
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: params?.steps || 30,
          guidance_scale: params?.guidance || 7.5,
          negative_prompt: params?.negativePrompt || 'blurry, low quality, distorted',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    // HF returns image as blob
    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return `data:image/png;base64,${base64}`;
  }
}

export const aiQueue = new AIQueue();
