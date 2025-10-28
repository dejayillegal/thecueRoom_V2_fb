
import { describe, it, expect, beforeEach } from 'vitest';

describe('AI API Endpoints', () => {
  beforeEach(() => {
    process.env.TEST_MODE = 'true';
  });

  it('POST /api/ai/generate should return job ID', async () => {
    const response = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'cover-art',
        prompt: 'Dark techno artwork',
        style: 'neon',
      }),
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.jobId).toBeDefined();
    expect(data.status).toBe('queued');
  });

  it('GET /api/ai/job/[id] should return job status', async () => {
    const createResponse = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'meme',
        topText: 'Top text',
        bottomText: 'Bottom text',
      }),
    });

    const { jobId } = await createResponse.json();

    const statusResponse = await fetch(`http://localhost:5000/api/ai/job/${jobId}`);
    expect(statusResponse.status).toBe(200);
    
    const job = await statusResponse.json();
    expect(job.id).toBe(jobId);
    expect(job.status).toBeDefined();
  });
});
