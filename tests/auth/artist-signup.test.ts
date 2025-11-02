
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Artist Signup Flow', () => {
  const BASE_URL = process.env.BASE_URL || 'http://0.0.0.0:5000';

  it('should create a normal user without verification job', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: `testuser${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        isArtist: false,
      }),
    });

    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.ok).toBe(true);
    expect(data.userId).toBeDefined();
    expect(data.role).toBe('user');
    expect(data.jobId).toBeUndefined();
  });

  it('should create artist user with verification job', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Artist',
        artistName: `TestArtist${Date.now()}`,
        email: `artist${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        username: `testartist${Date.now()}`,
        isArtist: true,
        socialProfileUrl: 'https://soundcloud.com/test-artist',
        region: 'Berlin, EU',
        genre: 'Techno',
      }),
    });

    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.ok).toBe(true);
    expect(data.userId).toBeDefined();
    expect(data.role).toBe('artist');
    expect(data.verificationJobId).toBeDefined();
  });

  it('should reject artist signup without required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Artist',
        email: `artist${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        isArtist: true,
        // Missing artistName, region, genre, socialProfileUrl
      }),
    });

    const data = await response.json();
    
    expect(response.ok).toBe(false);
    expect(data.ok).toBe(false);
  });

  it('should reject invalid social profile domain', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Artist',
        artistName: `TestArtist${Date.now()}`,
        email: `artist${Date.now()}@example.test`,
        password: 'Str0ng!Passw0rd',
        confirmPassword: 'Str0ng!Passw0rd',
        username: `testartist${Date.now()}`,
        isArtist: true,
        socialProfileUrl: 'https://example.com/profile',
        region: 'Berlin, EU',
        genre: 'Techno',
      }),
    });

    const data = await response.json();
    
    expect(response.ok).toBe(false);
    expect(data.error).toContain('recognized music platform');
  });
});
