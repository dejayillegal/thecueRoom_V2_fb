/*
 * PATH: apps/web/app/page.tsx
 * DESCRIPTION: Central hub for music news and creative AI tools. 
 * Implements advanced UI readiness logic with surgical precision.
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
      <div className="w-16 h-px bg-[#D1FF3D] animate-[pulse_3s_ease-in-out_infinite]" />
      <span className="text-[9px] font-mono uppercase tracking-[1em] font-bold">Establishing Signal</span>
    </div>
  );
}

async function fetchLandingData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://0.0.0.0:5000';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const [spotlightRes, trendingRes] = await Promise.all([
      fetch(`${baseUrl}/api/feeds?limit=8`, { 
        cache: 'no-store',
        signal: controller.signal 
      }),
      fetch(`${baseUrl}/api/feeds?limit=32&offset=0`, { 
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

    const spotlightFeeds = spotlightData.data || [];
    const trendingFeeds = trendingData.data || [];

    if (spotlightFeeds.length === 0 && trendingFeeds.length === 0) {
      return { spotlightFeeds: [], trendingFeeds: [], empty: true };
    }

    return { 
      spotlightFeeds, 
      trendingFeeds 
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { spotlightFeeds: [], trendingFeeds: [], timeout: true };
    }
    return { spotlightFeeds: [], trendingFeeds: [], error: true };
  }
}

export default async function HomePage() {
  const data = await fetchLandingData();
  const { spotlightFeeds, trendingFeeds } = data;

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-foreground selection:bg-[#D1FF3D] selection:text-[#0B0B0B] font-inter antialiased overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.03] grain-overlay" />
      
      <header className="fixed top-0 w-full z-40 bg-[#0B0B0B]/40 backdrop-blur-2xl border-b border-[#D1FF3D]/5">
        <div className="max-w-screen-2xl mx-auto px-10 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-8 group">
            <Logo className="w-5 h-5 grayscale opacity-30 group-hover:opacity-100 transition-all duration-1000" />
            <div className="h-4 w-[1px] bg-[#D1FF3D]/10 group-hover:h-8 transition-all duration-1000" />
            <span className="text-[9px] font-medium tracking-[0.6em] uppercase opacity-30 group-hover:opacity-100 transition-all duration-1000 font-mono">
              The Cue Room / V2
            </span>
          </Link>

          <nav className="flex items-center gap-16">
            <AuthButton />
          </nav>
        </div>
      </header>

      <section className="pt-24 min-h-[90vh] flex flex-col justify-end">
        {data.timeout || data.error ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 opacity-40">
            <span className="text-[9px] font-mono uppercase tracking-[1em] font-bold text-red-500/50">
              {data.timeout ? 'Signal Timeout' : 'Signal Lost'}
            </span>
          </div>
        ) : data.empty ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 opacity-20">
            <span className="text-[9px] font-mono uppercase tracking-[1em] font-bold">Establishing Signal</span>
          </div>
        ) : spotlightFeeds.length === 0 ? (
          <SectionSkeleton />
        ) : (
          <Suspense fallback={<SectionSkeleton />}>
            <SpotlightSection 
              initialFeeds={spotlightFeeds} 
              initialTrending={trendingFeeds} 
            />
          </Suspense>
        )}
      </section>

      <div className="max-w-screen-2xl mx-auto px-10">
        <LandingClientLayout>
          <header className="mb-32 flex flex-col md:flex-row items-baseline gap-12 md:gap-32">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.8em] text-[#D1FF3D] font-bold font-mono">
                02 / ARCHIVE
              </span>
              <h2 className="text-5xl md:text-8xl font-extralight tracking-tighter leading-[0.9] max-w-4xl italic">
                Signals. <br />
                <span className="font-normal not-italic opacity-40">Not Stories.</span>
              </h2>
            </div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/40 font-medium max-w-[200px] leading-relaxed">
              Synthesizing culture through raw signal acquisition.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-32">
            <Suspense fallback={
              <div className="py-48 flex flex-col items-center gap-8 opacity-10">
                <div className="w-12 h-px bg-[#D1FF3D] animate-pulse" />
                <span className="text-[10px] tracking-[0.8em] font-mono uppercase">Syncing Archive</span>
              </div>
            }>
              <NewsSection />
            </Suspense>
            <aside className="hidden xl:block w-px bg-gradient-to-b from-[#D1FF3D]/20 via-transparent to-transparent h-[800px] sticky top-48" />
          </div>
        </LandingClientLayout>

        <section className="py-48 md:py-64 border-t border-[#D1FF3D]/10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-48 items-start">
            <div className="space-y-24">
              <header className="space-y-8">
                <span className="text-[10px] uppercase tracking-[0.8em] text-muted-foreground font-mono">
                  03 / NETWORK
                </span>
                <h3 className="text-4xl md:text-6xl font-extralight tracking-tight leading-tight">
                  Discourse is the <br /> 
                  <span className="font-normal text-[#873BBF]">Primary Output.</span>
                </h3>
              </header>
              <div className="flex flex-col md:flex-row gap-24">
                <div className="space-y-8 max-w-sm">
                  <p className="text-sm font-light leading-relaxed text-muted-foreground/80">
                    Collaborative intelligence platforms for the underground. No noise. Pure synthesis.
                  </p>
                  <div className="flex gap-16">
                    <Link href="/community/forum" className="group flex items-center gap-4 text-[9px] uppercase tracking-[0.5em] font-bold text-[#D1FF3D]">
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-1">Entrance</span>
                    </Link>
                    <Link href="/gigs/india" className="group flex items-center gap-4 text-[9px] uppercase tracking-[0.5em] font-bold opacity-30 hover:opacity-100 transition-all">
                      <span className="border-b border-transparent group-hover:border-foreground transition-all pb-1">Radar</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative p-16 bg-[#111111] border border-[#D1FF3D]/5 group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1FF3D]/5 blur-[80px] group-hover:bg-[#873BBF]/10 transition-colors duration-1000" />
              <div className="relative space-y-12">
                <span className="text-[10px] uppercase tracking-[0.8em] text-muted-foreground font-mono">LABS</span>
                <h4 className="text-2xl font-light leading-tight">Identity Synthesis Engine.</h4>
                <p className="text-[10px] text-muted-foreground/40 leading-relaxed uppercase tracking-[0.3em] font-medium">
                  Cover Art / EPK / MEME / AVATAR
                </p>
                <Link href="/ai/cover-art" className="inline-block text-[9px] uppercase tracking-[0.6em] text-[#D1FF3D] font-bold group-hover:translate-x-4 transition-transform duration-700">
                  Begin &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#111111]/50 py-48 border-t border-[#D1FF3D]/5">
        <div className="max-w-screen-2xl mx-auto px-10 flex flex-col md:flex-row justify-between gap-32">
          <div className="max-w-sm space-y-12">
            <Logo className="w-6 h-6 grayscale opacity-10" />
            <p className="text-[9px] leading-loose text-muted-foreground/30 uppercase tracking-[0.4em] font-mono">
              TC.R V2 // {new Date().getFullYear()} <br />
              Synthesized by thecueRoom <br />
              All Vectors Reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-24">
            <div className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.6em] text-foreground font-bold font-mono">VECTORS</span>
              <div className="flex flex-col gap-4 text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                <Link href="/news" className="hover:text-[#D1FF3D] transition-colors">Archive</Link>
                <Link href="/feeds" className="hover:text-[#D1FF3D] transition-colors">Signals</Link>
                <Link href="/music/weekly" className="hover:text-[#D1FF3D] transition-colors">Weekly</Link>
              </div>
            </div>
            <div className="space-y-8">
              <span className="text-[10px] uppercase tracking-[0.6em] text-foreground font-bold font-mono">NETWORK</span>
              <div className="flex flex-col gap-4 text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                <Link href="/community/forum" className="hover:text-[#D1FF3D] transition-colors">Forum</Link>
                <Link href="/settings" className="hover:text-[#D1FF3D] transition-colors">Profile</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
