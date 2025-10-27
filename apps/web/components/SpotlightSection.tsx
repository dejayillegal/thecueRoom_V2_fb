
'use client';

import { useEffect, useState } from 'react';
import HomeClient, { FeedItem } from './HomeClient';
import TrendingCarousel from './TrendingCarousel';

export default function SpotlightSection({ 
  feeds, 
  trendingFeeds 
}: { 
  feeds: FeedItem[];
  trendingFeeds: FeedItem[];
}) {
  const [currentFeeds, setCurrentFeeds] = useState<FeedItem[]>(feeds);
  const [currentTrending, setCurrentTrending] = useState<FeedItem[]>(trendingFeeds);

  useEffect(() => {
    const refreshFeeds = async () => {
      try {
        const response = await fetch('/api/feeds?limit=24');
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const formattedFeeds = data.data.map((item: any) => ({
              title: item.title,
              url: item.link,
              summary: item.summary || '',
              image: item.image || `/api/og-fallback?title=${encodeURIComponent(item.title.slice(0, 120))}`,
              publishedAt: item.publishedAt,
              source: item.source?.name || 'Unknown',
              tags: item.tags || [],
            }));
            setCurrentFeeds(formattedFeeds);
            setCurrentTrending(formattedFeeds.slice(0, 8));
          }
        }
      } catch (error) {
        console.error('Failed to refresh feeds:', error);
      }
    };

    // Refresh every hour (3600000ms)
    const interval = setInterval(refreshFeeds, 3600000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section aria-label="Feeds">
      {currentTrending.length > 0 && (
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Trending Now
          </h2>
          <TrendingCarousel items={currentTrending} />
        </div>
      )}
      <HomeClient initialItems={currentFeeds} />
    </section>
  );
}
