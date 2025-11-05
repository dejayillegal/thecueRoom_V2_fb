
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDbClient } from '@/lib/db-client';
import { adminPlaylists } from '@thecueroom/db/schema';
import { eq } from 'drizzle-orm';

describe('Monthly Playlists API Integration', () => {
  let testPlaylistId: string;
  const db = getDbClient();

  beforeEach(async () => {
    // Clean test data
    await db.delete(adminPlaylists).where(eq(adminPlaylists.title, 'Test Playlist'));
  });

  afterEach(async () => {
    if (testPlaylistId) {
      await db.delete(adminPlaylists).where(eq(adminPlaylists.id, testPlaylistId));
    }
  });

  describe('POST /api/admin/monthly-playlists/validate', () => {
    it('should validate Spotify playlist URL', async () => {
      const response = await fetch('http://localhost:5000/api/admin/monthly-playlists/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.valid).toBe(true);
      expect(data.platform).toBe('spotify');
      expect(data.metadata).toBeDefined();
    });

    it('should validate SoundCloud playlist URL', async () => {
      const response = await fetch('http://localhost:5000/api/admin/monthly-playlists/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'https://soundcloud.com/user/sets/playlist',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.platform).toBe('soundcloud');
    });

    it('should reject invalid URL', async () => {
      const response = await fetch('http://localhost:5000/api/admin/monthly-playlists/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: 'not-a-valid-url',
        }),
      });

      const data = await response.json();
      expect(data.valid).toBe(false);
    });
  });

  describe('POST /api/admin/monthly-playlists/publish', () => {
    it('should publish playlist and make it live', async () => {
      // First create a draft playlist
      const createResponse = await fetch('http://localhost:5000/api/admin/monthly-playlists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Playlist',
          platform: 'spotify',
          platformId: 'test123',
          embedUrl: 'https://open.spotify.com/embed/playlist/test123',
          monthOf: '2025-11',
        }),
      });

      const createData = await createResponse.json();
      testPlaylistId = createData.id;

      // Publish it
      const publishResponse = await fetch('http://localhost:5000/api/admin/monthly-playlists/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: testPlaylistId,
        }),
      });

      const publishData = await publishResponse.json();
      expect(publishResponse.status).toBe(200);
      expect(publishData.ok).toBe(true);

      // Verify it's live
      const playlist = await db.query.adminPlaylists.findFirst({
        where: eq(adminPlaylists.id, testPlaylistId),
      });

      expect(playlist?.status).toBe('live');
      expect(playlist?.publishedAt).toBeDefined();
    });
  });
});
