import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('EPK AI Rewrite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return rewritten text with local fallback when HF token is not present', async () => {
    const originalText = 'I am a DJ who plays music at venues.';
    
    const response = await fetch('http://localhost:5000/api/epk/ai/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: originalText, tone: 'bio' })
    });

    const data = await response.json();
    
    expect(data.ok).toBe(true);
    expect(data.rewritten).toBeTruthy();
    expect(data.rewritten).not.toBe(originalText);
    expect(data.usedHF).toBe(false);
  });

  it('should handle invalid input gracefully', async () => {
    const response = await fetch('http://localhost:5000/api/epk/ai/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '', tone: 'bio' })
    });

    expect(response.status).toBe(400);
  });

  it('should support different tones', async () => {
    const tones = ['press', 'bio', 'concise', 'brutalist'];
    
    for (const tone of tones) {
      const response = await fetch('http://localhost:5000/api/epk/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: 'DJ performing at clubs worldwide.',
          tone 
        })
      });

      const data = await response.json();
      expect(data.ok).toBe(true);
    }
  });
});
