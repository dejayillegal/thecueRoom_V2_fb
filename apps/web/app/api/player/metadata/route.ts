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
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const platform = searchParams.get('platform');

    if (!url || !platform) {
      return NextResponse.json(
        { error: 'Missing url or platform parameter' },
        { status: 400 }
      );
    }

    if (platform === 'soundcloud') {
      // Extract playlist info from SoundCloud oEmbed API
      const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch SoundCloud metadata');
      }

      const data = await response.json();
      
      return NextResponse.json({
        title: data.title || 'Untitled Playlist',
        trackCount: data.track_count || 0,
        artwork_url: data.thumbnail_url,
        author_name: data.author_name,
      });
    }

    if (platform === 'mixcloud') {
      // Extract from embed URL or use Mixcloud API if available
      const embedMatch = url.match(/mixcloud\.com\/widget\/iframe\/\?hide_cover=1&feed=([^&]+)/);
      if (embedMatch) {
        const feedPath = decodeURIComponent(embedMatch[1]);
        const apiUrl = `https://api.mixcloud.com${feedPath}`;
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            title: data.name || 'Untitled Mix',
            trackCount: data.sections?.length || 0,
            artwork_url: data.pictures?.large,
            author_name: data.user?.name,
          });
        }
      }
    }

    return NextResponse.json({
      title: 'Untitled Playlist',
      trackCount: 0,
    });
  } catch (error) {
    console.error('Metadata fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
