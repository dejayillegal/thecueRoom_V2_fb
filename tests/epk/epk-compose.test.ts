import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';
const API_BASE = process.env.API_BASE || 'http://localhost:5000';

describe('EPK Compose & Stamping', () => {
  let testJobId: string;
  let testPdfPath: string;

  beforeAll(async () => {
    testJobId = nanoid();
    const jobDir = path.join(EPK_TEMP_DIR, testJobId);
    await fs.mkdir(jobDir, { recursive: true });

    testPdfPath = path.join(jobDir, 'epk.pdf');
    await fs.writeFile(testPdfPath, Buffer.from('%PDF-1.4\nTest PDF content\n%%EOF'));

    const jobMeta = {
      jobId: testJobId,
      status: 'done',
      progress: 100,
      resultUrl: `/api/epk/download/${testJobId}/epk.pdf`,
      artistName: 'Test Artist',
      releaseTitle: 'Test Release',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await fs.writeFile(
      path.join(EPK_TEMP_DIR, `${testJobId}.json`),
      JSON.stringify(jobMeta, null, 2)
    );
  });

  afterAll(async () => {
    try {
      const jobDir = path.join(EPK_TEMP_DIR, testJobId);
      await fs.rm(jobDir, { recursive: true, force: true });
      await fs.unlink(path.join(EPK_TEMP_DIR, `${testJobId}.json`));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should stamp PDF with artist name and watermark', async () => {
    const response = await fetch(`${API_BASE}/api/epk/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: testJobId,
        artistName: 'Test Artist',
        releaseTitle: 'Test Release',
        watermark: true,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.jobId).toBe(testJobId);
    expect(data.message).toContain('stamped');

    const stampedPdf = await fs.readFile(testPdfPath);
    expect(stampedPdf.length).toBeGreaterThan(0);
    expect(stampedPdf.toString().includes('%PDF')).toBe(true);
  });

  it('should return 404 for non-existent job', async () => {
    const response = await fetch(`${API_BASE}/api/epk/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: 'non-existent-job-id',
        artistName: 'Test Artist',
      }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('not found');
  });

  it('should validate request schema', async () => {
    const response = await fetch(`${API_BASE}/api/epk/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: testJobId,
        // Missing artistName
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Invalid');
  });
});
