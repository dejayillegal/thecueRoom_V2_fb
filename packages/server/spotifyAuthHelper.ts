import { LRUCache } from 'lru-cache';

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number;
}

interface SpotifyTrackMetadata {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
}

interface SpotifyPlaylistMetadata {
  id: string;
  name: string;
  description: string | null;
  owner: { display_name: string };
  images: Array<{ url: string }>;
  tracks: {
    total: number;
    items: Array<{ track: SpotifyTrackMetadata }>;
  };
  external_urls: { spotify: string };
}

const tokenCache = new LRUCache<string, SpotifyToken>({ max: 1, ttl: 3500 * 1000 });
const metadataCache = new LRUCache<string, any>({ max: 100, ttl: 3600 * 1000 });

export class SpotifyAuthHelper {
  private clientId: string;
  private clientSecret: string;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.SPOTIFY_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️  Spotify credentials not configured. Mock mode will be used.');
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    const cached = tokenCache.get('spotify_token');
    if (cached && cached.expiresAt > Date.now()) {
      return cached.access_token;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.statusText}`);
      }

      const data = await response.json() as Omit<SpotifyToken, 'expiresAt'>;
      const token: SpotifyToken = {
        ...data,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      tokenCache.set('spotify_token', token);
      return token.access_token;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      return null;
    }
  }

  async getPlaylistMetadata(playlistId: string): Promise<any> {
    const cacheKey = `playlist:${playlistId}`;
    const cached = metadataCache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const token = await this.getAccessToken();
    if (!token) {
      return this.getMockPlaylistMetadata(playlistId);
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}?fields=id,name,description,owner.display_name,images,tracks.total,tracks.items(track(id,name,artists,album,duration_ms,external_urls,preview_url)),external_urls`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json() as SpotifyPlaylistMetadata;
      const metadata = {
        id: data.id,
        title: data.name,
        description: data.description || '',
        platform: 'spotify' as const,
        ownerName: data.owner.display_name,
        coverImage: data.images[0]?.url || '',
        trackCount: data.tracks.total,
        tracks: data.tracks.items.slice(0, 10).map((item, idx) => ({
          id: item.track.id,
          title: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          duration: Math.floor(item.track.duration_ms / 1000),
          coverImage: item.track.album.images[0]?.url,
          url: item.track.external_urls.spotify,
          previewUrl: item.track.preview_url || undefined,
        })),
        embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
        webUrl: data.external_urls.spotify,
        cached: false,
      };

      metadataCache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching Spotify playlist:', error);
      return this.getMockPlaylistMetadata(playlistId);
    }
  }

  extractPlaylistId(url: string): string | null {
    const patterns = [
      /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/embed\/playlist\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  private getMockPlaylistMetadata(playlistId: string): any {
    return {
      id: playlistId,
      title: 'Mock Electronic Music Playlist',
      description: 'A curated selection of electronic tracks for November 2025',
      platform: 'spotify' as const,
      ownerName: 'TheCueRoom',
      coverImage: 'https://via.placeholder.com/300x300?text=Mock+Playlist',
      trackCount: 25,
      tracks: [
        {
          id: 'mock1',
          title: 'Midnight Dreams',
          artist: 'Electronic Artist',
          duration: 240,
          coverImage: 'https://via.placeholder.com/64x64',
          url: `https://open.spotify.com/track/mock1`,
          previewUrl: undefined,
        },
        {
          id: 'mock2',
          title: 'Neon Lights',
          artist: 'Synth Wave',
          duration: 195,
          coverImage: 'https://via.placeholder.com/64x64',
          url: `https://open.spotify.com/track/mock2`,
          previewUrl: undefined,
        },
      ],
      embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
      webUrl: `https://open.spotify.com/playlist/${playlistId}`,
      cached: false,
      mock: true,
    };
  }
}

export const spotifyHelper = new SpotifyAuthHelper();
