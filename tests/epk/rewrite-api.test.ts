import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EPK Rewrite API Endpoint', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.HF_TOKEN;
    delete process.env.PROVIDER_URL;
    delete process.env.PROVIDER_KEY;
  });

  it('should use HuggingFace when HF_TOKEN is available', async () => {
    process.env.HF_TOKEN = 'test-hf-token';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([{
        generated_text: 'Amazing techno artist\nInnovative producer with 5 years experience\nKnown for incredible performances at major festivals worldwide with technical mastery and unique sound.'
      }])
    });

    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Techno artist with 5 years of experience',
        tone: 'press'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('huggingface.co'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-hf-token'
        })
      })
    );

    expect(data.ok).toBe(true);
    expect(data.source).toBe('hf');
    expect(data.outputs).toHaveProperty('tagline');
    expect(data.outputs).toHaveProperty('blurb');
    expect(data.outputs).toHaveProperty('epk_bio');
  });

  it('should fall back to provider when HF fails', async () => {
    process.env.HF_TOKEN = 'test-hf-token';
    process.env.PROVIDER_URL = 'https://api.provider.com/v1/chat/completions';
    process.env.PROVIDER_KEY = 'test-provider-key';

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: 'Acclaimed techno artist\nExperienced producer with dynamic performances\nKnown for captivating audiences at major venues with technical skill and passion.'
            }
          }]
        })
      });

    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Techno artist with experience',
        tone: 'press'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('huggingface'), expect.any(Object));
    expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('provider.com'), expect.any(Object));

    expect(data.ok).toBe(true);
    expect(data.source).toBe('provider');
  });

  it('should use deterministic fallback when all AI providers fail', async () => {
    process.env.HF_TOKEN = 'test-hf-token';
    process.env.PROVIDER_URL = 'https://api.provider.com/v1/chat/completions';
    process.env.PROVIDER_KEY = 'test-provider-key';

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      });

    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        text: 'Electronic music artist with 5 years of experience. Performed at major venues.',
        tone: 'press'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.source).toBe('fallback');
    expect(data.outputs).toHaveProperty('tagline');
    expect(data.outputs).toHaveProperty('blurb');
    expect(data.outputs).toHaveProperty('epk_bio');
    expect(data.outputs.tagline.length).toBeLessThanOrEqual(80);
    expect(data.outputs.blurb.length).toBeGreaterThanOrEqual(90);
    expect(data.outputs.blurb.length).toBeLessThanOrEqual(160);
  });

  it('should use fallback directly when no AI credentials provided', async () => {
    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify({
        text: 'House music DJ',
        tone: 'concise'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(data.ok).toBe(true);
    expect(data.source).toBe('fallback');
  });

  it('should enforce rate limiting', async () => {
    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const requests = [];
    for (let i = 0; i < 6; i++) {
      const mockRequest = new Request('http://localhost/api/epk/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.1.100' },
        body: JSON.stringify({
          text: `Test ${i}`,
          tone: 'press'
        })
      });
      requests.push(POST(mockRequest));
    }

    const responses = await Promise.all(requests);
    const lastResponse = responses[5];
    const lastData = await lastResponse.json();

    expect(lastResponse.status).toBe(429);
    expect(lastData.ok).toBe(false);
    expect(lastData.error).toContain('Rate limit');
  });

  it('should validate request body schema', async () => {
    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'a'.repeat(5000),
        tone: 'invalid-tone'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Invalid request');
  });

  it('should handle different tone parameters correctly', async () => {
    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const tones = ['press', 'concise', 'promotional', 'technical'] as const;
    
    for (const tone of tones) {
      const mockRequest = new Request('http://localhost/api/epk/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `127.0.0.${tones.indexOf(tone)}` },
        body: JSON.stringify({
          text: 'Electronic music artist with experience',
          tone
        })
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.outputs).toBeTruthy();
    }
  });

  it('should produce deterministic output from fallback for same input', async () => {
    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const text = 'Techno DJ with 10 years experience. Performed at Berghain and Fabric.';
    
    const mockRequest1 = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ text, tone: 'press' })
    });

    const mockRequest2 = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ text, tone: 'press' })
    });

    const response1 = await POST(mockRequest1);
    const data1 = await response1.json();

    await new Promise(resolve => setTimeout(resolve, 100));

    const response2 = await POST(mockRequest2);
    const data2 = await response2.json();

    expect(data1.source).toBe('fallback');
    expect(data2.source).toBe('fallback');
    expect(data1.outputs.tagline).toBe(data2.outputs.tagline);
    expect(data1.outputs.blurb).toBe(data2.outputs.blurb);
    expect(data1.outputs.epk_bio).toBe(data2.outputs.epk_bio);
  });

  it('should handle HF timeout gracefully', async () => {
    process.env.HF_TOKEN = 'test-hf-token';

    mockFetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    );

    const { POST } = await import('@/app/api/epk/rewrite/route');
    
    const mockRequest = new Request('http://localhost/api/epk/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.5' },
      body: JSON.stringify({
        text: 'Test artist',
        tone: 'press'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.source).toBe('fallback');
  }, 20000);
});
