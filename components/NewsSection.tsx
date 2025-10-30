import { memo, useState } from 'react';
import Link from 'next/link';
import { FeedItem } from '@/types/feed';

// Assuming FeedItem and formatDate are defined elsewhere and imported correctly.
// For example:
// interface FeedItem {
//   id: string;
//   title: string;
//   summary: string | null;
//   url: string;
//   image: string | null;
//   source: string | null;
//   publishedAt: Date;
//   tags: string[] | null;
// }
//
// const formatDate = (date: Date): string => {
//   // Implementation for formatting date
//   return date.toLocaleDateString();
// };

const FeedCard = memo(({ feed, formatDate }: { feed: FeedItem; formatDate: (date: Date) => string }) => {
  const [imgSrc, setImgSrc] = useState(feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <article className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all group rounded-xl">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer">
        <div className="relative h-48 sm:h-52 md:h-56 bg-neutral-900 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={feed.title}
            className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
              setIsLoading(false);
            }}
            loading="lazy"
          />
        </div>

        <div className="p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-medium text-primary truncate max-w-[60%]">
              {feed.source || 'Unknown Source'}
            </span>
            <span>{formatDate(feed.publishedAt)}</span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {feed.title}
          </h3>

          {feed.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {feed.summary}
            </p>
          )}

          {feed.tags && feed.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {feed.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 text-[10px] bg-primary/20 text-primary border border-primary/30 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
});

// Placeholder for potential other components or exports if they were part of the original file.
// export default FeedCard;