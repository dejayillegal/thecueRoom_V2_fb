import { Suspense } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';
import NewsSection from '@/components/NewsSection';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

function SpotlightSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-[60vh] bg-muted rounded-none border border-border" />
    </div>
  );
}

async function fetchSpotlightData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://0.0.0.0:5000';

  try {
    const [spotlightRes, trendingRes] = await Promise.all([
      fetch(`${baseUrl}/api/feeds?limit=8`, {
        next: { revalidate: 60 },
        headers: { 'Accept': 'application/json' }
      }),
      fetch(`${baseUrl}/api/feeds?limit=32&offset=0`, {
        next: { revalidate: 60 },
        headers: { 'Accept': 'application/json' }
      })
    ]);

    const [spotlightData, trendingData] = await Promise.all([
      spotlightRes.json(),
      trendingRes.json()
    ]);

    const spotlightFeeds = spotlightData.data?.slice(0, 8).map((item: any) => ({
      title: item.title,
      url: item.url,
      summary: item.summary || '',
      image: item.image,
      publishedAt: item.publishedAt,
      source: item.source || 'Unknown',
      tags: item.tags || [],
    })) || [];

    const scoredTrending = trendingData.data?.map((item: any, index: number) => {
      const now = Date.now();
      const publishedTime = new Date(item.publishedAt).getTime();
      const ageInHours = (now - publishedTime) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - (ageInHours / 48) * 100);
      const diversityBonus = index % 3 === 0 ? 20 : 0;
      const tagScore = Math.min(30, (item.tags?.length || 0) * 5);
      return { ...item, trendingScore: recencyScore + diversityBonus + tagScore };
    }) || [];

    const trendingFeeds = scoredTrending
      .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
      .slice(0, 16)
      .map((item: any) => ({
        title: item.title,
        url: item.url,
        summary: item.summary || '',
        image: item.image,
        publishedAt: item.publishedAt,
        source: item.source || 'Unknown',
        tags: item.tags || [],
      }));

    return { spotlightFeeds, trendingFeeds };
  } catch (error) {
    console.error('Error fetching spotlight data:', error);
    return { spotlightFeeds: [], trendingFeeds: [] };
  }
}

export default async function HomePage() {
  const { spotlightFeeds, trendingFeeds } = await fetchSpotlightData();

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.03] grain-overlay" />
      
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <Logo className="w-7 h-7 grayscale group-hover:grayscale-0 transition-all duration-500" />
            <span className="text-sm font-medium tracking-[0.2em] uppercase transition-colors">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-8">
            <AuthButton />
          </nav>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-12 md:py-20 space-y-32">
        <section className="relative">
          <header className="mb-12 flex items-baseline justify-between border-b border-border pb-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              01 / Featured Signal
            </h2>
          </header>
          <Suspense fallback={<SpotlightSkeleton />}>
            <SpotlightSection initialFeeds={spotlightFeeds} initialTrending={trendingFeeds} />
          </Suspense>
        </section>

        <section className="relative">
          <header className="mb-12 flex items-baseline justify-between border-b border-border pb-4">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              02 / Editorial Stream
            </h2>
          </header>
          <Suspense fallback={<div className="text-center py-24 text-sm tracking-widest text-muted-foreground animate-pulse">SYNCHRONIZING STREAM...</div>}>
            <NewsSection />
          </Suspense>
        </section>
      </div>

      <footer className="border-t border-border/40 bg-muted/5 py-24 mt-32">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6 max-w-sm">
            <Logo className="w-8 h-8 grayscale opacity-50" />
            <p className="text-sm leading-relaxed text-muted-foreground font-light">
              An editorial gateway for the underground. Designed for the quiet observation of culture.
            </p>
          </div>
          <div className="flex flex-wrap gap-12 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="space-y-4">
              <span className="text-foreground font-medium">Platform</span>
              <div className="flex flex-col gap-2">
                <Link href="/news" className="hover:text-primary transition-colors">Archive</Link>
                <Link href="/feeds" className="hover:text-primary transition-colors">Signals</Link>
              </div>
            </div>
            <div className="space-y-4">
              <span className="text-foreground font-medium">Community</span>
              <div className="flex flex-col gap-2">
                <Link href="/community/forum" className="hover:text-primary transition-colors">Forum</Link>
                <Link href="/events/submit" className="hover:text-primary transition-colors">Gigs</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-screen-2xl mx-auto px-6 mt-24 pt-8 border-t border-border/10 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          <span>&copy; {new Date().getFullYear()} thecueRoom</span>
          <span>Zero Error Build</span>
        </div>
      </footer>
    </main>
  );
}
