
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, ExternalLink, Calendar } from 'lucide-react';
import { PlaylistMetadata } from '@thecueroom/shared/adminPlaylistSchemas';
import { ImageWithFallback } from '@/components/ImageWithFallback';

interface PlaylistPreviewCardProps {
  metadata: PlaylistMetadata;
  onSaveDraft?: () => void;
  onPublishNow?: () => void;
  onSchedule?: () => void;
  loading?: boolean;
}

export function PlaylistPreviewCard({
  metadata,
  onSaveDraft,
  onPublishNow,
  onSchedule,
  loading = false,
}: PlaylistPreviewCardProps) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 p-6">
      <div className="flex gap-4 mb-4">
        {metadata.coverImage && (
          <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-800">
            <ImageWithFallback
              src={metadata.coverImage}
              alt={metadata.title}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{metadata.title}</h3>
          {metadata.description && (
            <p className="text-neutral-400 text-sm mb-3 line-clamp-2">{metadata.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Music size={14} />
              {metadata.trackCount} tracks
            </span>
            {metadata.owner && <span>By {metadata.owner}</span>}
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-800 pt-4 mt-4">
        <div className="flex gap-2 flex-wrap">
          {onSaveDraft && (
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="border-neutral-700"
              disabled={loading}
            >
              Save as Draft
            </Button>
          )}
          {onSchedule && (
            <Button
              onClick={onSchedule}
              variant="outline"
              className="border-neutral-700"
              disabled={loading}
            >
              <Calendar size={16} className="mr-2" />
              Schedule
            </Button>
          )}
          {onPublishNow && (
            <Button
              onClick={onPublishNow}
              className="bg-lime-500 hover:bg-lime-600 text-black"
              disabled={loading}
            >
              Publish Now
            </Button>
          )}
          <Button
            variant="outline"
            className="border-neutral-700 ml-auto"
            asChild
          >
            <a
              href={metadata.embedUrl.replace('/embed/', '/')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} className="mr-2" />
              Open in Spotify
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
