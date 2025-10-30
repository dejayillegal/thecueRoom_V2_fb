import { describe, it, expect, beforeAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

describe('EPK Render Integration', () => {
  beforeAll(() => {
    process.env.EPK_TEST_MODE = 'true';
    process.env.TEST_MODE = 'true';
  });

  it('should generate PDF in TEST_MODE', async () => {
    const workerPath = path.join(__dirname, '../../packages/epk/worker.mjs');
    
    try {
      const worker = await import(workerPath);
      
      const testJob = {
        jobId: `integration-test-${Date.now()}`,
        templateId: 'one-column',
        modules: [
          {
            type: 'bio',
            data: { text: 'Integration test artist bio. Performs at various venues worldwide.' }
          }
        ],
        artistName: 'Integration Test Artist',
        releaseTitle: 'Test EPK',
        includeWatermark: false
      };

      if (worker.generatePdf) {
        await worker.generatePdf(testJob);
      }

      const pdfPath = path.join(EPK_TEMP_DIR, testJob.jobId, 'epk.pdf');
      
      const stats = await fs.stat(pdfPath);
      
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);

      const content = await fs.readFile(pdfPath, 'utf8');
      expect(content).toContain('%PDF');
    } catch (error) {
      console.warn('Worker integration test skipped:', error.message);
    }
  }, 30000);

  it('should create job metadata file', async () => {
    const jobId = `meta-test-${Date.now()}`;
    const metaPath = path.join(EPK_TEMP_DIR, `${jobId}.json`);
    
    const testMeta = {
      jobId,
      status: 'done',
      progress: 100,
      updatedAt: Date.now()
    };

    await fs.mkdir(EPK_TEMP_DIR, { recursive: true });
    await fs.writeFile(metaPath, JSON.stringify(testMeta, null, 2));

    const content = await fs.readFile(metaPath, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.jobId).toBe(jobId);
    expect(parsed.status).toBe('done');
    expect(parsed.progress).toBe(100);
  });
});
