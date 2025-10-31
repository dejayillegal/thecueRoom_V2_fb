import { describe, it, expect } from 'vitest';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';

describe('EPK End-to-End Workflow', () => {
  it('should complete full EPK generation and share flow', async () => {
    const generateResponse = await fetch(`${API_BASE}/api/epk/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'brutalist-onepage',
        modules: [
          {
            id: '1',
            type: 'bio',
            order: 0,
            data: { text: 'End-to-end test biography for artist' },
          },
          {
            id: '2',
            type: 'tracklist',
            order: 1,
            data: {
              tracks: [
                { title: 'Track One' },
                { title: 'Track Two' },
              ],
            },
          },
        ],
        artistName: 'E2E Test Artist',
        releaseTitle: 'E2E Test Release',
        exportFormat: 'pdf',
        includeWatermark: true,
      }),
    });

    expect(generateResponse.status).toBe(200);
    const generateData = await generateResponse.json();
    expect(generateData.ok).toBe(true);
    expect(generateData.jobId).toBeDefined();

    const jobId = generateData.jobId;

    let jobStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 30;
    let jobData;

    while (jobStatus !== 'done' && jobStatus !== 'error' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`${API_BASE}/api/epk/job/${jobId}`);
      jobData = await statusResponse.json();
      jobStatus = jobData.status;
      attempts++;

      console.log(`Attempt ${attempts}: Job status is ${jobStatus} (${jobData.progress}%)`);
    }

    expect(jobStatus).toBe('done');
    expect(jobData.progress).toBe(100);
    expect(jobData.resultUrl).toBeDefined();

    const downloadResponse = await fetch(`${API_BASE}${jobData.resultUrl}`);
    expect(downloadResponse.status).toBe(200);
    expect(downloadResponse.headers.get('content-type')).toContain('application/pdf');

    const pdfBuffer = await downloadResponse.arrayBuffer();
    expect(pdfBuffer.byteLength).toBeGreaterThan(0);

    const pdfString = Buffer.from(pdfBuffer).toString();
    expect(pdfString).toContain('%PDF');

    const shareResponse = await fetch(`${API_BASE}/api/epk/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        artistName: 'E2E Test Artist',
        releaseTitle: 'E2E Test Release',
      }),
    });

    expect(shareResponse.status).toBe(200);
    const shareData = await shareResponse.json();
    expect(shareData.ok).toBe(true);
    expect(shareData.shareId).toBeDefined();
    expect(shareData.url).toBeDefined();

    console.log(`✅ EPK generated successfully: ${jobId}`);
    console.log(`✅ Download URL: ${jobData.resultUrl}`);
    console.log(`✅ Share URL: ${shareData.url}`);
  }, 60000); // 60 second timeout for full workflow
});
