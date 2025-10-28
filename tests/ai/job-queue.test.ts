
import { describe, it, expect, beforeEach } from 'vitest';
import { aiQueue } from '@/lib/ai-queue';

describe('AI Job Queue', () => {
  beforeEach(() => {
    process.env.TEST_MODE = 'true';
  });

  it('should create a job and return job ID', async () => {
    const jobId = await aiQueue.createJob(
      'cover-art',
      'Dark techno artwork',
      'test-user-id',
      { style: 'neon' }
    );

    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');
  });

  it('should retrieve job status', async () => {
    const jobId = await aiQueue.createJob(
      'meme',
      'Funny meme',
      'test-user-id'
    );

    const job = await aiQueue.getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.id).toBe(jobId);
  });

  it('should process jobs in TEST_MODE', async () => {
    const jobId = await aiQueue.createJob(
      'cover-art',
      'Test artwork',
      'test-user-id'
    );

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200));

    const job = await aiQueue.getJob(jobId);
    expect(job?.status).toBe('completed');
    expect(job?.resultUrl).toBeDefined();
  });
});
