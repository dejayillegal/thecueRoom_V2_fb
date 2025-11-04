'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface EmbedPlayerProps {
  platform: string;
  platformId?: string;
  embedUrl?: string;
  trackUrl?: string;
  title?: string;
  className?: string;
  height?: number;
}

export function EmbedPlayer({
  platform,
  platformId,
  embedUrl,
  trackUrl,
  title = 'Playlist',
  className = '',
  height = 380,
}: EmbedPlayerProps) {
  const [failed, setFailed] = useState(false);

  const getEmbedUrl = () => {
    if (embedUrl) return embedUrl;

    switch (platform) {
      case 'spotify':
        if (platformId) {
          return `https://open.spotify.com/embed/playlist/${platformId}`;
        }
        break;
      case 'soundcloud':
        if (platformId) {
          return `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/${platformId}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
        }
        break;
      case 'mixcloud':
        if (platformId) {
          return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(platformId)}`;
        }
        break;
      case 'beatport':
      case 'bandcamp':
      case 'youtube_music':
        break;
    }
    return null;
  };

  const finalEmbedUrl = getEmbedUrl();

  if (failed || !finalEmbedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-900 rounded-lg p-8 ${className}`} style={{ height }}>
        <p className="text-neutral-400 mb-4">
          {failed ? 'Unable to load embed player' : 'Embed not available for this platform'}
        </p>
        {trackUrl && (
          <a
            href={trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black rounded-md transition-colors"
          >
            Open on {platform.charAt(0).toUpperCase() + platform.slice(1)}
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={finalEmbedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        allow="encrypted-media"
        loading="lazy"
        title={title}
        className="rounded-lg"
        onError={() => setFailed(true)}
      />
    </div>
  );
}