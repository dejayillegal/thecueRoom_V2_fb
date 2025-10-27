import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import Image from 'next/image';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthModal } from '@/components/auth/SignInModal';

async function getSpotlightFeeds() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/feeds?limit=8`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
    return [];
  }
}

async function getNewsFeeds() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/api/feeds?limit=24&offset=8`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  } catch {
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

async function SpotlightSection() {
  const feeds = await getSpotlightFeeds();

  if (!feeds || feeds.length === 0) {
    return (
      <div className="relative h-[60vh] bg-card rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">No spotlight feeds available yet. Run the ingestion script to populate feeds.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[60vh] bg-card rounded-lg overflow-hidden border border-border">
      <Image
        src={feeds[0]?.image || '/placeholder.jpg'}
        alt={feeds[0]?.title || 'Spotlight'}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <h2 className="text-4xl font-bold mb-2">{feeds[0]?.title}</h2>
        <p className="text-lg text-muted-foreground mb-4">{feeds[0]?.summary}</p>
        {feeds[0]?.link && (
          <Link
            href={feeds[0].link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Read More
          </Link>
        )}
      </div>
    </div>
  );
}

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
          href={feed.link}
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
            <AuthModal />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Spotlight</h2>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Live Updates</span>
            </div>
          </div>

          <Suspense fallback={<SpotlightSkeleton />}>
            <SpotlightSection />
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