
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import TrendingCarousel, { FeedItem } from './TrendingCarousel';

export default function SpotlightSection({ 
  initialFeeds, 
  initialTrending 
}: { 
  initialFeeds: FeedItem[];
  initialTrending: FeedItem[];
}) {
  const [currentFeeds, setCurrentFeeds] = useState<FeedItem[]>(initialFeeds);
  const [currentTrending, setCurrentTrending] = useState<FeedItem[]>(initialTrending);

  useEffect(() => {
    const refreshFeeds = async () => {
      try {
        // Fetch spotlight feeds
        const spotlightResponse = await fetch('/api/feeds?limit=24');
        if (spotlightResponse.ok) {
          const spotlightData = await spotlightResponse.json();
          if (spotlightData.data && spotlightData.data.length > 0) {
            const formattedFeeds = spotlightData.data.map((item: any) => ({
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

  if (!currentFeeds || currentFeeds.length === 0) {
    return (
      <div className="relative h-[60vh] bg-card rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No spotlight feeds available yet. Run the ingestion script to populate feeds.</p>
      </div>
    );
  }

  return (
    <section className="relative mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Spotlight</h2>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Live Updates</span>
        </div>
      </div>

      <div className="relative h-[60vh] bg-card rounded-lg overflow-hidden border border-border">
        <Image
          src={currentFeeds[0]?.image || '/placeholder.jpg'}
          alt={currentFeeds[0]?.title || 'Spotlight'}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h2 className="text-4xl font-bold mb-2">{currentFeeds[0]?.title}</h2>
          <p className="text-lg text-muted-foreground mb-4">{currentFeeds[0]?.summary}</p>
          {currentFeeds[0]?.url && (
            <Link
              href={currentFeeds[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Read More
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4">Trending Now</h3>
        <TrendingCarousel feeds={currentTrending} />
      </div>
    </section>
  );
}
