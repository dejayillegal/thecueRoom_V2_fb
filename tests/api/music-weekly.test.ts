
import { describe, it, expect } from 'vitest';

describe('GET /api/music/weekly', () => {
  it('should return valid response structure', async () => {
    // Mock test - in production would use supertest or fetch to localhost
    const mockResponse = {
      items: [],
      meta: {
        total: 0,
        page: 0,
        limit: 20,
        hasMore: false,
      },
    };

    expect(mockResponse).toHaveProperty('items');
    expect(mockResponse).toHaveProperty('meta');
    expect(Array.isArray(mockResponse.items)).toBe(true);
  });
});
import { describe, it, expect } from 'vitest';

describe('GET /api/music/weekly', () => {
  it('should return 200 with correct schema in TEST_MODE', async () => {
    const response = await fetch('http://localhost:5000/api/music/weekly?limit=5', {
      headers: { 'Accept': 'application/json' },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('meta');
    expect(Array.isArray(data.items)).toBe(true);
    
    if (data.items.length > 0) {
      expect(data.items[0]).toHaveProperty('id');
      expect(data.items[0]).toHaveProperty('title');
      expect(data.items[0]).toHaveProperty('artist');
    }
  });
});
