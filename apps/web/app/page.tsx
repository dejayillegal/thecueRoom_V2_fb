
'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';

interface FeedItem {
  id: string;
  title: string;
  summary: string | null;
  link: string;
  image: string | null;
  tags: string[] | null;
  publishedAt: Date;
  source: {
    id: string;
    name: string;
  } | null;
}

function SpotlightSkeleton() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="relative h-[50vh] md:h-[60vh] bg-muted animate-pulse rounded-xl overflow-hidden border border-border" />

      <div className="mt-6 md:mt-8">
        <div className="h-7 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-card rounded-lg overflow-hidden border border-border">
              <div className="h-40 bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <article key={i} className="bg-card rounded-lg overflow-hidden border border-border">
          <div className="relative h-48 bg-muted animate-pulse" />
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 bg-muted animate-pulse rounded w-full" />
            <div className="h-5 bg-muted animate-pulse rounded w-4/5" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </article>
      ))}
    </div>
  );
}

function NewsSection() {
  const [newsFeeds, setNewsFeeds] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const loadNewsFeeds = useCallback(async (isInitial = false) => {
    if (!isInitial && (isLoadingMore || !hasMore)) return;
    
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ limit: '24' });
      if (cursor) params.append('cursor', cursor);
      
      const response = await fetch(`/api/feeds?${params}`);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setNewsFeeds(prev => isInitial ? data.data : [...prev, ...data.data]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load news feeds:', error);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [cursor, hasMore, isLoadingMore]);

  useEffect(() => {
    loadNewsFeeds(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadNewsFeeds(false);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadNewsFeeds, isLoading]);

  if (isLoading) {
    return <NewsSkeleton />;
  }

  if (newsFeeds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No news feeds available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsFeeds.map((feed) => (
          <article
            key={feed.id}
            className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all group"
          >
            <Link href={feed.link} target="_blank" rel="noopener noreferrer">
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden">
                <Image
                  src={feed.image || `/api/og-fallback?title=${encodeURIComponent(feed.title.slice(0, 120))}`}
                  alt={feed.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-xs font-medium text-white drop-shadow-lg">
                      {feed.source?.name || 'Unknown Source'}
                    </div>
                    <div className="text-xs text-white/90 drop-shadow-lg">
                      {formatDate(feed.publishedAt)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-primary">
                    {feed.source?.name || 'Unknown Source'}
                  </span>
                  <span>{formatDate(feed.publishedAt)}</span>
                </div>
                
                <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {feed.title}
                </h3>
                
                {feed.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {feed.summary}
                  </p>
                )}
                
                {feed.tags && feed.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {feed.tags.slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>

      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading more feeds...</span>
          </div>
        )}
        {!hasMore && newsFeeds.length > 0 && (
          <p className="text-muted-foreground">You've reached the end</p>
        )}
      </div>
    </>
  );
}

export default function HomePage() {
  const [spotlightFeeds, setSpotlightFeeds] = useState<any[]>([]);
  const [trendingFeeds, setTrendingFeeds] = useState<any[]>([]);
  const [isLoadingSpotlight, setIsLoadingSpotlight] = useState(true);

  useEffect(() => {
    const fetchSpotlightData = async () => {
      try {
        // Fetch 8 items for spotlight hero
        const spotlightResponse = await fetch('/api/feeds?limit=8');
        const spotlightData = await spotlightResponse.json();
        
        // Fetch 32 items for trending (will be scored and filtered to 16)
        const trendingResponse = await fetch('/api/feeds?limit=32&offset=0');
        const trendingData = await trendingResponse.json();
        
        if (spotlightData.data && Array.isArray(spotlightData.data)) {
          const formattedSpotlight = spotlightData.data.map((item: any) => ({
            title: item.title,
            url: item.link,
            summary: item.summary || '',
            image: item.image || `/api/og-fallback?title=${encodeURIComponent(item.title.slice(0, 120))}`,
            publishedAt: item.publishedAt,
            source: item.source?.name || 'Unknown',
            tags: item.tags || [],
          }));
          
          setSpotlightFeeds(formattedSpotlight);
        }
        
        if (trendingData.data && Array.isArray(trendingData.data)) {
          // Calculate trending scores
          const scoredItems = trendingData.data.map((item: any, index: number) => {
            const now = Date.now();
            const publishedTime = new Date(item.publishedAt).getTime();
            const ageInHours = (now - publishedTime) / (1000 * 60 * 60);
            
            const recencyScore = Math.max(0, 100 - (ageInHours / 48) * 100);
            const diversityBonus = index % 3 === 0 ? 20 : 0;
            const tagScore = Math.min(30, (item.tags?.length || 0) * 5);
            
            return {
              ...item,
              trendingScore: recencyScore + diversityBonus + tagScore
            };
          });
          
          // Sort and take top 16
          const topTrending = scoredItems
            .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
            .slice(0, 16)
            .map((item: any) => ({
              title: item.title,
              url: item.link,
              summary: item.summary || '',
              image: item.image || `/api/og-fallback?title=${encodeURIComponent(item.title.slice(0, 120))}`,
              publishedAt: item.publishedAt,
              source: item.source?.name || 'Unknown',
              tags: item.tags || [],
            }));
          
          setTrendingFeeds(topTrending);
        }
      } catch (error) {
        console.error('Failed to fetch spotlight feeds:', error);
      } finally {
        setIsLoadingSpotlight(false);
      }
    };

    fetchSpotlightData();
  }, []);

  return (
    <main className="min-h-screen">
      <div className="grain-overlay" />

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <AuthButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <section className="mb-12">
          {isLoadingSpotlight ? (
            <SpotlightSkeleton />
          ) : (
            <SpotlightSection initialFeeds={spotlightFeeds} initialTrending={trendingFeeds} />
          )}
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Latest News</h2>
          </div>

          <NewsSection />
        </section>
      </div>
    </main>
  );
}
