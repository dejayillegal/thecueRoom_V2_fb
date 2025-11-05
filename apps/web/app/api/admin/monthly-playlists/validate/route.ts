import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { ValidatePlaylistInputSchema } from '@thecueroom/shared/monthlyPlaylistSchemas';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedInput = ValidatePlaylistInputSchema.safeParse(body);
    
    if (!validatedInput.success) {
      return NextResponse.json({
        ok: false,
        valid: false,
        error: 'Invalid input',
        details: validatedInput.error.issues,
      }, { status: 400 });
    }

    const { url, platform: providedPlatform } = validatedInput.data;

    let platform: 'spotify' | 'soundcloud' | 'mixcloud' | null = null;
    let platformId: string | null = null;
    let embedUrl: string | null = null;
    let metadata: any = {};

    if (url.includes('spotify.com')) {
      platform = 'spotify';
      const playlistMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (playlistMatch) {
        platformId = playlistMatch[1];
        embedUrl = `https://open.spotify.com/embed/playlist/${platformId}`;
        
        if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
          try {
            const authResponse = await fetch('https://accounts.spotify.com/api/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
              },
              body: 'grant_type=client_credentials',
            });

            if (authResponse.ok) {
              const authData = await authResponse.json();
              const playlistResponse = await fetch(`https://api.spotify.com/v1/playlists/${platformId}`, {
                headers: {
                  'Authorization': `Bearer ${authData.access_token}`,
                },
              });

              if (playlistResponse.ok) {
                const playlistData = await playlistResponse.json();
                metadata = {
                  title: playlistData.name,
                  description: playlistData.description,
                  coverImage: playlistData.images?.[0]?.url,
                  trackCount: playlistData.tracks?.total || 0,
                  owner: playlistData.owner?.display_name,
                };
              }
            }
          } catch (error) {
            console.error('Error fetching Spotify metadata:', error);
          }
        }
      }
    } else if (url.includes('soundcloud.com')) {
      platform = 'soundcloud';
      const match = url.match(/soundcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        platformId = match[1];
        embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
      }
    } else if (url.includes('mixcloud.com')) {
      platform = 'mixcloud';
      const match = url.match(/mixcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        platformId = match[1];
        embedUrl = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(`/${match[1]}/`)}`;
      }
    }

    if (!platform || !platformId || !embedUrl) {
      return NextResponse.json({
        ok: true,
        valid: false,
        error: 'Unable to extract playlist information from URL',
      });
    }

    if (providedPlatform && providedPlatform !== platform) {
      return NextResponse.json({
        ok: true,
        valid: false,
        error: `URL appears to be from ${platform}, but ${providedPlatform} was specified`,
      });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      platform,
      platformId,
      embedUrl,
      ...metadata,
    });
  } catch (error) {
    console.error('Error validating playlist URL:', error);
    return NextResponse.json({
      ok: false,
      valid: false,
      error: 'Failed to validate playlist URL',
    }, { status: 500 });
  }
}
