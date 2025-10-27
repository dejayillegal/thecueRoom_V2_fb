import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function FeedsPage() {
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
            <Link href="/feeds" className="text-primary font-semibold">
              Feeds
            </Link>
            <Link href="/ai/cover-art" className="hover:text-primary transition-colors">
              AI Studio
            </Link>
            <Link href="/community" className="hover:text-primary transition-colors">
              Community
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Global Music Feeds
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Curated techno & house news from 60+ worldwide sources
          </p>

          <Suspense fallback={<FeedsSkeleton />}>
            <FeedsContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function FeedsSkeleton() {
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

async function FeedsContent() {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg p-8 border border-border text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          The feed system is currently being built. Features include:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Fast-loading feed cards
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Title, summary, and thumbnails
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> External source links
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Category and tag filtering
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span> Infinite scroll pagination
          </li>
        </ul>
      </div>
    </div>
  );
}
