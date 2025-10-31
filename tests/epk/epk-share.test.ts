import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const EPK_TEMP_DIR = process.env.EPK_TEMP_DIR || '/tmp/thecueroom-epk';

describe('EPK Share Links', () => {
  let testJobId: string;
  let testShareId: string;

  beforeAll(async () => {
    testJobId = nanoid();
    
    const jobMeta = {
      jobId: testJobId,
      status: 'done',
      progress: 100,
      resultUrl: `/api/epk/download/${testJobId}/epk.pdf`,
      artistName: 'Share Test Artist',
      releaseTitle: 'Share Test Release',
      modules: [
        { id: '1', type: 'bio', order: 0, data: { text: 'Test bio for sharing' } }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await fs.mkdir(EPK_TEMP_DIR, { recursive: true });
    await fs.writeFile(
      path.join(EPK_TEMP_DIR, `${testJobId}.json`),
      JSON.stringify(jobMeta, null, 2)
    );
  });

  afterAll(async () => {
    try {
      await fs.unlink(path.join(EPK_TEMP_DIR, `${testJobId}.json`));
      
      const sharesFile = path.join(process.cwd(), '.local/state/epk-shares.json');
      const sharesData = JSON.parse(await fs.readFile(sharesFile, 'utf-8'));
      if (testShareId && sharesData.shares[testShareId]) {
        delete sharesData.shares[testShareId];
        await fs.writeFile(sharesFile, JSON.stringify(sharesData, null, 2));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a shareable link', async () => {
    const response = await fetch(`${API_BASE}/api/epk/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: testJobId,
        artistName: 'Share Test Artist',
        releaseTitle: 'Share Test Release',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.shareId).toBeDefined();
    expect(data.url).toBeDefined();
    expect(data.url).toContain('/epk/s/');
    expect(data.expiresAt).toBeGreaterThan(Date.now());

    testShareId = data.shareId;
  });

  it('should retrieve share information', async () => {
    expect(testShareId).toBeDefined();

    const response = await fetch(`${API_BASE}/api/epk/share?shareId=${testShareId}`);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.share).toBeDefined();
    expect(data.share.shareId).toBe(testShareId);
    expect(data.share.jobId).toBe(testJobId);
    expect(data.share.artistName).toBe('Share Test Artist');
    expect(data.share.accessCount).toBeGreaterThanOrEqual(1);
  });

  it('should return 404 for non-existent share', async () => {
    const response = await fetch(`${API_BASE}/api/epk/share?shareId=nonexistent`);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  it('should validate request schema', async () => {
    const response = await fetch(`${API_BASE}/api/epk/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required jobId
        artistName: 'Test',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.ok).toBe(false);
  });

  it('should increment access count on repeated retrievals', async () => {
    expect(testShareId).toBeDefined();

    const response1 = await fetch(`${API_BASE}/api/epk/share?shareId=${testShareId}`);
    const data1 = await response1.json();
    const count1 = data1.share.accessCount;

    const response2 = await fetch(`${API_BASE}/api/epk/share?shareId=${testShareId}`);
    const data2 = await response2.json();
    const count2 = data2.share.accessCount;

    expect(count2).toBe(count1 + 1);
  });
});
