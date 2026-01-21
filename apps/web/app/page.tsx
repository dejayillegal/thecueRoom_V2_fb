/*
 * PATH: apps/web/app/page.tsx
 * DESCRIPTION: Central hub for music news and creative AI tools. 
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';
import NewsSection from '@/components/NewsSection';
import { Logo } from '@/components/Logo';
import LandingClientLayout from '@/components/LandingClientLayout';

export const dynamic = 'force-dynamic';

function SectionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 opacity-20">
      <div className="w-16 h-px bg-[#D1FF3D]" />
    </div>
  );
}

async function fetchLandingData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://0.0.0.0:5000';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const [spotlightRes, trendingRes] = await Promise.all([
      fetch(`${baseUrl}/api/feeds?limit=5`, { 
        cache: 'no-store',
        signal: controller.signal 
      }),
      fetch(`${baseUrl}/api/feeds?limit=24&offset=0`, { 
        cache: 'no-store',
        signal: controller.signal
      })
    ]);

    clearTimeout(timeoutId);

    if (!spotlightRes.ok || !trendingRes.ok) {
      return { spotlightFeeds: [], trendingFeeds: [], error: true };
    }

    const spotlightData = await spotlightRes.json();
    const trendingData = await trendingRes.json();

    return { 
      spotlightFeeds: spotlightData.data || [], 
      trendingFeeds: trendingData.data || [],
      status: spotlightData.status || trendingData.status || { isRunning: false, hasFailed: false }
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    return { spotlightFeeds: [], trendingFeeds: [], error: true };
  }
}

export default async function HomePage() {
  const data = await fetchLandingData();
  const { spotlightFeeds, trendingFeeds } = data;

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-foreground selection:bg-[#D1FF3D] selection:text-[#0B0B0B] font-inter antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.03] grain-overlay" />
      
      <header className="fixed top-0 w-full z-50 bg-[#0B0B0B]/40 backdrop-blur-2xl border-b border-[#D1FF3D]/5">
        <div className="max-w-screen-2xl mx-auto px-6 sm:px-10 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 sm:gap-6 group">
            <Logo className="w-6 h-6 sm:w-8 sm:h-8 grayscale opacity-40 group-hover:opacity-100 transition-all duration-1000" />
            <div className="h-6 sm:h-8 w-[1px] bg-[#D1FF3D]/10 group-hover:bg-[#D1FF3D]/40 transition-all duration-1000" />
            <span className="text-[10px] sm:text-sm font-bold tracking-[0.4em] sm:tracking-[0.6em] uppercase opacity-40 group-hover:opacity-100 transition-all duration-1000 font-mono text-[#D1FF3D] leading-none">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-6 sm:gap-12">
            <AuthButton />
          </nav>
        </div>
      </header>

      <section className="min-h-[70vh] md:min-h-[85vh] flex flex-col justify-end">
        <Suspense fallback={<SectionSkeleton />}>
          <SpotlightSection 
            initialFeeds={spotlightFeeds} 
            initialTrending={trendingFeeds} 
          />
        </Suspense>
      </section>

      <div className="max-w-screen-2xl mx-auto px-6 sm:px-10">
        <LandingClientLayout>
          <div className="py-12 md:py-32">
            <Suspense fallback={
              <div className="py-24 md:py-48 flex flex-col items-center gap-8 opacity-10">
                <div className="w-12 h-px bg-[#D1FF3D]" />
              </div>
            }>
              <NewsSection />
            </Suspense>
          </div>
        </LandingClientLayout>
      </div>

      <footer className="bg-[#0B0B0B] py-16 md:py-32 border-t border-[#D1FF3D]/5 mt-12 md:mt-32">
        <div className="max-w-screen-2xl mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16">
            <div className="flex items-center gap-12">
              <Logo className="w-6 h-6 grayscale opacity-10" />
              <div className="h-4 w-[1px] bg-[#D1FF3D]/5" />
              <p className="text-[9px] sm:text-[10px] leading-loose text-muted-foreground/20 uppercase tracking-[0.4em] sm:tracking-[0.6em] font-mono font-bold">
                thecueRoom / V2 / {new Date().getFullYear()}
              </p>
            </div>
            <div className="flex items-center gap-6 sm:gap-8">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground/10 uppercase tracking-[0.3em] sm:tracking-[0.4em] font-mono">
                All Vectors Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
