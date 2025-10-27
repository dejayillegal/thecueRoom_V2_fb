import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import Image from 'next/image';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthButton';
import { getDbClient } from '@/lib/db-client';
import { feeds, sources } from '@thecueroom/db/schema';
import { eq, desc } from 'drizzle-orm';

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

async function getSpotlightFeeds() {
  try {
    const db = getDbClient();

    const results = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        source: {
          name: sources.name,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .orderBy(desc(feeds.publishedAt))
      .limit(24);

    return results.map(r => ({
      title: r.title,
      url: r.link,
      summary: r.summary || '',
      image: r.image && r.image !== '/placeholder.jpg' ? r.image : `/api/og-fallback?title=${encodeURIComponent(r.title.slice(0, 120))}`,
      publishedAt: r.publishedAt.toISOString(),
      source: r.source?.name || 'Unknown',
      tags: (r.tags as string[]) || [],
    }));
  } catch (error) {
    console.error('Failed to fetch spotlight feeds:', error);
    return [];
  }
}

async function getNewsFeeds() {
  try {
    const db = getDbClient();

    const results = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        source: {
          name: sources.name,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .orderBy(desc(feeds.publishedAt))
      .limit(24);

    return results.map(r => ({
      title: r.title,
      url: r.link,
      summary: r.summary || '',
      image: r.image && r.image !== '/placeholder.jpg' ? r.image : `/api/og-fallback?title=${encodeURIComponent(r.title.slice(0, 120))}`,
      publishedAt: r.publishedAt.toISOString(),
      source: r.source?.name || 'Unknown',
      tags: (r.tags as string[]) || [],
    }));
  } catch (error) {
    console.error('Failed to fetch news feeds:', error);
    return [];
  }
}

async function getTrendingFeeds() {
  try {
    const db = getDbClient();

    const results = await db
      .select({
        id: feeds.id,
        title: feeds.title,
        summary: feeds.summary,
        link: feeds.link,
        image: feeds.image,
        tags: feeds.tags,
        publishedAt: feeds.publishedAt,
        source: {
          name: sources.name,
        },
      })
      .from(feeds)
      .leftJoin(sources, eq(feeds.sourceId, sources.id))
      .orderBy(desc(feeds.publishedAt))
      .limit(8);

    return results.map(r => ({
      title: r.title,
      url: r.link,
      summary: r.summary || '',
      image: r.image && r.image !== '/placeholder.jpg' ? r.image : `/api/og-fallback?title=${encodeURIComponent(r.title.slice(0, 120))}`,
      publishedAt: r.publishedAt.toISOString(),
      source: r.source?.name || 'Unknown',
      tags: (r.tags as string[]) || [],
    }));
  } catch (error) {
    console.error('Failed to fetch trending feeds:', error);
    return [];
  }
}

function SpotlightSkeleton() {
  return (
    <div className="relative h-[60vh] bg-muted animate-pulse rounded-lg" />
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card rounded-lg p-6 border border-border animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-muted rounded w-full mb-2"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="flex items-center space-x-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex-shrink-0 w-64 h-32 bg-card rounded-lg border border-border"></div>
      ))}
    </div>
  );
}

import SpotlightSection from '@/components/SpotlightSection';

async function NewsSection() {
  const feeds = await getNewsFeeds();

  if (!feeds || feeds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No news feeds available yet. Run the ingestion script to populate feeds.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {feeds.map((feed: any) => (
        <Link
          key={feed.id}
          href={feed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-colors group"
        >
          {feed.image && (
            <div className="relative h-48 overflow-hidden">
              <Image
                src={feed.image}
                alt={feed.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}
          <div className="p-6">
            <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
              {feed.title}
            </h3>
            {feed.summary && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {feed.summary}
              </p>
            )}
            {feed.tags && feed.tags.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {feed.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-muted rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="grain-overlay" />

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/feeds" className="hover:text-primary transition-colors">
              Feeds
            </Link>
            <AuthButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <section className="mb-16">
          <Suspense fallback={<SpotlightSkeleton />}>
            {(async () => {
              const spotlightFeeds = await getSpotlightFeeds();
              const trendingFeeds = await getTrendingFeeds();
              return <SpotlightSection initialFeeds={spotlightFeeds} initialTrending={trendingFeeds} />;
            })()}
          </Suspense>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Latest News</h2>
            <Link
              href="/feeds"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Suspense fallback={<NewsSkeleton />}>
            <NewsSection />
          </Suspense>
        </section>
      </div>
    </main>
  );
}