import { describe, it, expect } from 'vitest';

describe('EPK Job Queue', () => {
  it('should create a job and return jobId', async () => {
    const response = await fetch('http://localhost:5000/api/epk/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [
          {
            id: 'test-1',
            type: 'bio',
            order: 0,
            data: { text: 'Test bio' }
          }
        ],
        artistName: 'Test Artist',
        exportFormat: 'pdf'
      })
    });

    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.jobId).toBeTruthy();
    expect(data.status).toBe('queued');
  });

  it('should retrieve job status', async () => {
    const createResponse = await fetch('http://localhost:5000/api/epk/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [],
        exportFormat: 'pdf'
      })
    });

    const { jobId } = await createResponse.json();

    const statusResponse = await fetch(`http://localhost:5000/api/epk/job/${jobId}`);
    const statusData = await statusResponse.json();
    
    expect(statusData.ok).toBe(true);
    expect(statusData.job).toBeTruthy();
    expect(statusData.job.jobId).toBe(jobId);
  });

  it('should validate request data', async () => {
    const response = await fetch('http://localhost:5000/api/epk/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invalid: 'data'
      })
    });

    expect(response.status).toBe(400);
  });
});
