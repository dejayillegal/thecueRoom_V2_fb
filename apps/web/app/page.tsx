import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';
import NewsSection from '@/components/NewsSection';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

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

async function fetchSpotlightData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

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

    return {
      ...item,
      trendingScore: recencyScore + diversityBonus + tagScore
    };
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
}

export default async function HomePage() {
  const { spotlightFeeds, trendingFeeds } = await fetchSpotlightData();

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
          <Suspense fallback={<SpotlightSkeleton />}>
            <SpotlightSection initialFeeds={spotlightFeeds} initialTrending={trendingFeeds} />
          </Suspense>
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Latest News</h2>
          </div>

          <Suspense fallback={<div className="text-center py-12">Loading news...</div>}>
            <NewsSection />
          </Suspense>
        </section>
      </div>
    </main>
  );
}