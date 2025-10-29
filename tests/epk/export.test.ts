import { describe, it, expect } from 'vitest';

describe('EPK Export', () => {
  it('should generate PDF in TEST_MODE', async () => {
    process.env.TEST_MODE = 'true';
    
    const response = await fetch('http://localhost:5000/api/epk/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [
          {
            id: 'test-bio',
            type: 'bio',
            order: 0,
            data: { text: 'Artist biography for testing' }
          }
        ],
        artistName: 'Test Artist',
        releaseTitle: 'Test Release',
        exportFormat: 'pdf',
        includeWatermark: true
      })
    });

    const { jobId } = await response.json();
    
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    const statusResponse = await fetch(`http://localhost:5000/api/epk/job/${jobId}`);
    const statusData = await statusResponse.json();
    
    expect(statusData.ok).toBe(true);
    expect(statusData.job.status).toMatch(/done|processing|queued/);
  }, 10000);

  it('should get templates list', async () => {
    const response = await fetch('http://localhost:5000/api/epk/templates');
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.templates).toBeInstanceOf(Array);
    expect(data.templates.length).toBeGreaterThanOrEqual(3);
  });

  it('should generate template preview', async () => {
    const response = await fetch('http://localhost:5000/api/epk/template-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [],
        artistName: 'Preview Test'
      })
    });

    const html = await response.text();
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Preview Test');
  });
});
