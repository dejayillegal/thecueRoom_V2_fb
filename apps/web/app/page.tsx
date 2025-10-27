
import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';

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

async function getNewsFe eds() {
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

function NewsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-muted h-64 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

async function SpotlightCarousel() {
  const items = await getSpotlightFeeds();
  
  if (!items || items.length === 0) {
    return (
      <div className="relative h-[60vh] bg-card rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading spotlight stories...</p>
      </div>
    );
  }

  const featured = items[0];

  return (
    <div className="relative h-[60vh] rounded-lg overflow-hidden group">
      <Image
        src={featured.image || '/placeholder.png'}
        alt={featured.title}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-wider text-primary mb-2">
            {featured.source?.name || 'Featured'}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {featured.title}
          </h2>
          <p className="text-lg text-gray-200 mb-6 line-clamp-2">
            {featured.summary}
          </p>
          <Link
            href={featured.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Read Full Story
          </Link>
        </div>
      </div>

      <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {items.slice(0, 7).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === 0 ? 'w-8 bg-primary' : 'w-1.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

async function NewsGrid() {
  const items = await getNewsFeeds();

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No news items available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item: any) => (
        <Link
          key={item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
        >
          <div className="relative h-48">
            <Image
              src={item.image || '/placeholder.png'}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {item.source?.name} • {new Date(item.publishedAt).toLocaleDateString()}
            </p>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.summary}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-semibold">thecueRoom</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#news" className="text-sm hover:text-primary transition-colors">
              News
            </Link>
            <Link href="#community" className="text-sm hover:text-primary transition-colors">
              Community
            </Link>
          </nav>

          <Button size="sm" className="gap-2">
            <Users className="w-4 h-4" />
            Login / Sign Up
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Spotlight</h2>
          </div>
          <Suspense fallback={<SpotlightSkeleton />}>
            <SpotlightCarousel />
          </Suspense>
        </section>

        <section id="news" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link href="/feeds" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <Suspense fallback={<NewsGridSkeleton />}>
            <NewsGrid />
          </Suspense>
        </section>
      </main>

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo className="w-8 h-8 mb-4" />
              <p className="text-sm text-muted-foreground">
                Your hub for underground techno & house music news, AI creative tools, and community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/ai/cover-art" className="hover:text-primary">AI Cover Art</Link></li>
                <li><Link href="/ai/epk" className="hover:text-primary">EPK Generator</Link></li>
                <li><Link href="/meme-generator" className="hover:text-primary">Meme Generator</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/community" className="hover:text-primary">Forum</Link></li>
                <li><Link href="/gigs" className="hover:text-primary">Gig Radar</Link></li>
                <li><Link href="/music" className="hover:text-primary">Weekly Music</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Instagram</a></li>
                <li><a href="#" className="hover:text-primary">SoundCloud</a></li>
                <li><a href="#" className="hover:text-primary">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} thecueRoom. Built for underground techno & house artists.
          </div>
        </div>
      </footer>
    </div>
  );
}
