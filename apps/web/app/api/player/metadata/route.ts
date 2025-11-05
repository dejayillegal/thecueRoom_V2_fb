import { NextRequest, NextResponse } from 'next/server';
import { MetadataRequestSchema } from '@thecueroom/shared/playerSchemas';
import { spotifyHelper } from '@thecueroom/server/spotifyAuthHelper';
import { z } from 'zod';

const QuerySchema = z.object({
  url: z.string().url('Invalid URL'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedQuery = QuerySchema.safeParse({
      url: searchParams.get('url'),
    });

    if (!validatedQuery.success) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid query parameters',
        details: validatedQuery.error.issues,
      }, { status: 400 });
    }

    const { url } = validatedQuery.data;

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json({
        ok: false,
        error: 'Unsupported platform',
      }, { status: 400 });
    }

    let metadata;
    
    if (platform === 'spotify') {
      const playlistId = spotifyHelper.extractPlaylistId(url);
      if (!playlistId) {
        return NextResponse.json({
          ok: false,
          error: 'Invalid Spotify URL',
        }, { status: 400 });
      }
      
      metadata = await spotifyHelper.getPlaylistMetadata(playlistId);
    } else {
      metadata = getMockMetadata(url, platform);
    }

    return NextResponse.json({
      ok: true,
      data: metadata,
      cached: metadata.cached || false,
    });
  } catch (error: any) {
    console.error('[Player Metadata API] Error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Failed to fetch metadata',
      message: error.message,
    }, { status: 500 });
  }
}

function detectPlatform(url: string): string | null {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('soundcloud.com')) return 'soundcloud';
  if (url.includes('mixcloud.com')) return 'mixcloud';
  if (url.includes('bandcamp.com')) return 'bandcamp';
  if (url.includes('youtube.com') || url.includes('music.youtube.com')) return 'youtube_music';
  return null;
}

function getMockMetadata(url: string, platform: string) {
  return {
    id: 'mock_' + Math.random().toString(36).substr(2, 9),
    title: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} Playlist`,
    description: `A demonstration playlist from ${platform}`,
    platform,
    ownerName: 'TheCueRoom Demo',
    coverImage: 'https://via.placeholder.com/300x300?text=Playlist',
    trackCount: 20,
    tracks: [],
    embedUrl: url,
    webUrl: url,
    cached: false,
    mock: true,
  };
}
