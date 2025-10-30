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
    <article className="bg-card overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 group rounded-xl shadow-lg hover:shadow-xl">
      <Link href={feed.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative h-56 sm:h-60 md:h-64 bg-neutral-900 overflow-hidden rounded-t-xl">
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 animate-pulse" />
          )}
          <img
            src={imgSrc}
            alt={feed.title}
            className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgSrc(`/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`);
              setIsLoading(false);
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-4 sm:p-5 space-y-3 bg-card">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-primary truncate max-w-[65%] uppercase tracking-wide">
              {feed.source || 'Unknown Source'}
            </span>
            <span className="text-[11px]">{formatDate(feed.publishedAt)}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
            {feed.title}
          </h3>

          {feed.summary && (
            <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
              {feed.summary}
            </p>
          )}

          {feed.tags && feed.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {feed.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-3 py-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/30 rounded-full hover:bg-primary/20 transition-colors"
                >
                  #{tag}
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