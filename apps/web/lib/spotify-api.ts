
import { PlaylistMetadata } from '@thecueroom/shared/adminPlaylistSchemas';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyPlaylistResponse {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data: SpotifyTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // Refresh 1 min early
  };

  return data.access_token;
}

export async function validateSpotifyPlaylist(playlistId: string): Promise<PlaylistMetadata> {
  const token = await getSpotifyToken();

  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new Error('Spotify API rate limited. Please try again later.');
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Playlist not found or is private');
    }
    throw new Error(`Failed to fetch playlist: ${response.status}`);
  }

  const data: SpotifyPlaylistResponse = await response.json();

  if (data.tracks.total === 0) {
    throw new Error('Playlist is empty');
  }

  return {
    title: data.name,
    description: data.description || undefined,
    coverImage: data.images[0]?.url,
    trackCount: data.tracks.total,
    platformId: data.id,
    embedUrl: `https://open.spotify.com/embed/playlist/${data.id}`,
    owner: data.owner.display_name,
  };
}

export function extractSpotifyPlaylistId(url: string): string | null {
  const patterns = [
    /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
