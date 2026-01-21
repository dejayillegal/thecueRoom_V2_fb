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
        <div className="max-w-screen-2xl mx-auto px-10 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-12 group">
            <Logo className="w-6 h-6 grayscale opacity-40 group-hover:opacity-100 transition-all duration-1000" />
            <div className="h-6 w-[1px] bg-[#D1FF3D]/10 group-hover:bg-[#D1FF3D]/40 transition-all duration-1000" />
            <span className="text-[10px] font-bold tracking-[0.8em] uppercase opacity-40 group-hover:opacity-100 transition-all duration-1000 font-mono text-[#D1FF3D]">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-16">
            <AuthButton />
          </nav>
        </div>
      </header>

      <section className="min-h-screen flex flex-col justify-end">
        <Suspense fallback={<SectionSkeleton />}>
          <SpotlightSection 
            initialFeeds={spotlightFeeds} 
            initialTrending={trendingFeeds} 
          />
        </Suspense>
      </section>

      <div className="max-w-screen-2xl mx-auto px-10">
        <LandingClientLayout>
          <header className="mb-48 mt-48 space-y-8">
            <span className="text-[11px] uppercase tracking-[1em] text-[#D1FF3D] font-bold font-mono">
              01 / ARCHIVE
            </span>
            <div className="flex flex-col md:flex-row items-baseline gap-12 md:gap-32 justify-between">
              <h2 className="text-6xl md:text-[12rem] font-extralight tracking-tighter leading-[0.8] max-w-5xl italic">
                Signals. <br />
                <span className="font-normal not-italic opacity-20">Not Stories.</span>
              </h2>
              <p className="text-[10px] uppercase tracking-[0.6em] text-muted-foreground/40 font-bold max-w-[240px] leading-relaxed border-l border-[#D1FF3D]/10 pl-8">
                Synthesizing underground culture through raw signal acquisition.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-48">
            <Suspense fallback={
              <div className="py-48 flex flex-col items-center gap-8 opacity-10">
                <div className="w-12 h-px bg-[#D1FF3D] animate-pulse" />
                <span className="text-[10px] tracking-[0.8em] font-mono uppercase">Syncing Archive</span>
              </div>
            }>
              <NewsSection />
            </Suspense>
            <aside className="hidden xl:block w-px bg-gradient-to-b from-[#D1FF3D]/20 via-transparent to-transparent h-[1200px] sticky top-48" />
          </div>
        </LandingClientLayout>

        <section className="py-64 md:py-96 border-t border-[#D1FF3D]/5">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-64 items-start">
            <div className="space-y-32">
              <header className="space-y-12">
                <span className="text-[11px] uppercase tracking-[1em] text-muted-foreground/40 font-bold font-mono">
                  02 / NETWORK
                </span>
                <h3 className="text-5xl md:text-[8rem] font-extralight tracking-tighter leading-[0.8]">
                  Discourse is <br /> 
                  <span className="font-normal text-[#873BBF]">Primary.</span>
                </h3>
              </header>
              <div className="flex flex-col md:flex-row gap-32">
                <div className="space-y-12 max-w-md border-l border-[#D1FF3D]/10 pl-8">
                  <p className="text-base font-light leading-relaxed text-muted-foreground/60 italic">
                    Collaborative intelligence platforms for the underground. No noise. Pure synthesis.
                  </p>
                  <div className="flex gap-24">
                    <Link href="/community/forum" className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.6em] font-bold text-[#D1FF3D]">
                      <span className="border-b border-transparent group-hover:border-[#D1FF3D] transition-all pb-2">Entrance</span>
                    </Link>
                    <Link href="/gigs/india" className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.6em] font-bold opacity-30 hover:opacity-100 transition-all">
                      <span className="border-b border-transparent group-hover:border-foreground transition-all pb-2">Radar</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative p-24 bg-[#0B0B0B] border border-[#D1FF3D]/5 group overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D1FF3D]/5 blur-[120px] group-hover:bg-[#873BBF]/10 transition-colors duration-1000" />
              <div className="relative space-y-16">
                <span className="text-[11px] uppercase tracking-[1em] text-muted-foreground/40 font-bold font-mono">03 / LABS</span>
                <h4 className="text-4xl font-extralight tracking-tighter leading-tight italic">Identity Synthesis.</h4>
                <p className="text-[10px] text-muted-foreground/30 leading-relaxed uppercase tracking-[0.4em] font-bold border-t border-[#D1FF3D]/5 pt-8">
                  Cover Art • EPK • Meme • Avatar
                </p>
                <Link href="/ai/cover-art" className="inline-block text-[10px] uppercase tracking-[0.8em] text-[#D1FF3D] font-bold group-hover:translate-x-4 transition-transform duration-700">
                  Begin Sequence &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#0B0B0B] py-64 border-t border-[#D1FF3D]/5">
        <div className="max-w-screen-2xl mx-auto px-10 flex flex-col md:flex-row justify-between gap-48">
          <div className="max-w-sm space-y-16">
            <Logo className="w-8 h-8 grayscale opacity-10" />
            <p className="text-[10px] leading-loose text-muted-foreground/20 uppercase tracking-[0.6em] font-mono font-bold">
              thecueRoom / V2 / {new Date().getFullYear()} <br />
              All Vectors Reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-32">
            <div className="space-y-12">
              <span className="text-[11px] uppercase tracking-[0.8em] text-foreground font-bold font-mono">ARCHIVE</span>
              <div className="flex flex-col gap-6 text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40 font-bold">
                <Link href="/news" className="hover:text-[#D1FF3D] transition-colors">Vectors</Link>
                <Link href="/feeds" className="hover:text-[#D1FF3D] transition-colors">Signals</Link>
              </div>
            </div>
            <div className="space-y-12">
              <span className="text-[11px] uppercase tracking-[0.8em] text-foreground font-bold font-mono">NETWORK</span>
              <div className="flex flex-col gap-6 text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40 font-bold">
                <Link href="/community/forum" className="hover:text-[#D1FF3D] transition-colors">Discourse</Link>
                <Link href="/settings" className="hover:text-[#D1FF3D] transition-colors">Identity</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
