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

    // Spotify
    if (url.includes('spotify.com/playlist/')) {
      platform = 'spotify';
      const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        platformId = match[1];
        embedUrl = `https://open.spotify.com/embed/playlist/${platformId}`;

        // Fetch metadata using Spotify API (requires authentication for full details)
        // For public playlists, oEmbed might be sufficient but API gives more control.
        // Using oEmbed here for simplicity as per original intent.
        try {
          const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
          const oEmbedRes = await fetch(oEmbedUrl);

          if (oEmbedRes.ok) {
            const oEmbedData = await oEmbedRes.json();
            metadata = {
              platform: 'spotify',
              platformId,
              embedUrl,
              title: oEmbedData.title || 'Spotify Playlist',
              trackCount: null, // oEmbed doesn't provide this directly, will fetch total from API if needed later
              coverImage: oEmbedData.thumbnail_url || null,
            };
          } else {
            metadata = {
              platform: 'spotify',
              platformId,
              embedUrl,
              title: 'Spotify Playlist',
              trackCount: null,
              coverImage: null,
            };
          }
        } catch (error) {
          console.error('Error fetching Spotify oEmbed:', error);
          metadata = {
            platform: 'spotify',
            platformId,
            embedUrl,
            title: 'Spotify Playlist',
            trackCount: null,
            coverImage: null,
          };
        }
      }
    } else if (url.includes('soundcloud.com')) {
      platform = 'soundcloud';
      const match = url.match(/soundcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        platformId = match[1];
        embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;

        // Fetch SoundCloud metadata using oEmbed API
        const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
        const oEmbedRes = await fetch(oEmbedUrl);

        if (!oEmbedRes.ok) {
          return NextResponse.json({
            ok: true,
            valid: false,
            error: 'Could not fetch SoundCloud playlist metadata',
          });
        }

        const oEmbedData = await oEmbedRes.json();

        // Extract title - remove "by <author>" suffix if present
        let title = oEmbedData.title || 'Untitled Playlist';
        if (oEmbedData.author_name && title.includes(`by ${oEmbedData.author_name}`)) {
          title = title.replace(new RegExp(`\\s*by\\s*${oEmbedData.author_name}\\s*$`, 'i'), '').trim();
        }

        // Try to extract track count from HTML if available
        let trackCount = 0;
        try {
          const htmlRes = await fetch(url);
          const html = await htmlRes.text();
          const trackMatch = html.match(/(\d+)\s*tracks?/i);
          if (trackMatch) {
            trackCount = parseInt(trackMatch[1], 10);
          }
        } catch (e) {
          console.error('Error fetching SoundCloud HTML for track count:', e);
        }

        metadata = {
          platform: 'soundcloud',
          platformId,
          embedUrl,
          title,
          description: oEmbedData.description || undefined,
          coverImage: oEmbedData.thumbnail_url || undefined,
          trackCount,
          metadata: {
            trackCount,
            author: oEmbedData.author_name,
            authorUrl: oEmbedData.author_url,
          },
        };
      }
    } else if (url.includes('mixcloud.com')) {
      platform = 'mixcloud';
      const match = url.match(/mixcloud\.com\/([^\/]+\/[^\/\?]+)/);
      if (match) {
        platformId = match[1];
        embedUrl = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(`/${match[1]}/`)}`;

        // Fetch Mixcloud metadata via oEmbed API
        try {
          const oEmbedUrl = `https://www.mixcloud.com/oembed/?url=${encodeURIComponent(url)}&format=json`;
          const oEmbedRes = await fetch(oEmbedUrl);
          if (oEmbedRes.ok) {
            const oEmbedData = await oEmbedRes.json();
            metadata = {
              platform: 'mixcloud',
              platformId,
              embedUrl,
              title: oEmbedData.title || 'Mixcloud Mix',
              trackCount: null, // Mixcloud oEmbed doesn't provide track count
              coverImage: oEmbedData.thumbnail_url || oEmbedData.image || null,
            };
          } else {
            metadata = {
              platform: 'mixcloud',
              platformId,
              embedUrl,
              title: 'Mixcloud Mix',
              trackCount: null,
              coverImage: null,
            };
          }
        } catch (error) {
          console.error('Error fetching Mixcloud oEmbed:', error);
          metadata = {
            platform: 'mixcloud',
            platformId,
            embedUrl,
            title: 'Mixcloud Mix',
            trackCount: null,
            coverImage: null,
          };
        }
      }
    }

    if (!platform || !platformId || !embedUrl) {
      return NextResponse.json({
        ok: false,
        valid: false,
        error: 'Could not parse playlist URL. Please provide a valid Spotify, SoundCloud, or Mixcloud playlist URL.',
      }, { status: 400 });
    }

    if (providedPlatform && providedPlatform !== platform) {
      return NextResponse.json({
        ok: true,
        valid: false,
        error: `URL appears to be from ${platform}, but ${providedPlatform} was specified`,
      });
    }

    // Return the consolidated metadata
    return NextResponse.json({
      ok: true,
      valid: true,
      platform,
      platformId,
      embedUrl,
      metadata,
    });
  } catch (error) {
    console.error('Error validating playlist:', error);
    return NextResponse.json({
      ok: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate playlist',
    }, { status: 500 });
  }
}