import { Suspense } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';
import NewsSection from '@/components/NewsSection';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

/**
 * LOADING SKELETONS
 * Maintained for perceived performance during SSR/Streaming
 */
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="h-[70vh] bg-muted/10 border border-border/20" />
    </div>
  );
}

/**
 * DATA ACQUISITION
 * Consumes core feed and trending APIs
 */
async function fetchLandingData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://0.0.0.0:5000';
  try {
    const [spotlightRes, trendingRes] = await Promise.all([
      fetch(`${baseUrl}/api/feeds?limit=8`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/feeds?limit=32&offset=0`, { next: { revalidate: 60 } })
    ]);

    const [spotlightData, trendingData] = await Promise.all([
      spotlightRes.json(),
      trendingRes.json()
    ]);

    const spotlightFeeds = spotlightData.data?.slice(0, 8) || [];
    const trendingFeeds = trendingData.data?.slice(0, 16) || [];

    return { spotlightFeeds, trendingFeeds };
  } catch (error) {
    return { spotlightFeeds: [], trendingFeeds: [] };
  }
}

export default async function HomePage() {
  const { spotlightFeeds, trendingFeeds } = await fetchLandingData();

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-inter">
      {/* ATMOSPHERIC LAYER: Subtle grain for editorial texture */}
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.02] grain-overlay" />
      
      {/* 
          STAGING: MINIMALIST NAVIGATION 
          Attention: Silence. No unnecessary links. Focus is the content.
      */}
      <header className="fixed top-0 w-full z-40 bg-background/60 backdrop-blur-xl border-b border-border/5">
        <div className="max-w-screen-2xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-6 group">
            <Logo className="w-6 h-6 grayscale opacity-40 group-hover:opacity-100 transition-all duration-700" />
            <span className="text-[10px] font-medium tracking-[0.4em] uppercase opacity-40 group-hover:opacity-100 transition-all duration-700">
              thecueRoom
            </span>
          </Link>

          <nav className="flex items-center gap-12">
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* 
          I. PRIMARY SIGNAL SURFACE
          The singular focal point. Cinematic entry into the current state of culture.
      */}
      <section className="pt-20">
        <Suspense fallback={<SectionSkeleton />}>
          <SpotlightSection 
            initialFeeds={spotlightFeeds} 
            initialTrending={trendingFeeds} 
          />
        </Suspense>
      </section>

      <div className="max-w-screen-xl mx-auto px-8">
        {/* 
            II. EDITORIAL STREAM (Curated Intelligence)
            Chronological intelligence. Deep vertical rhythm for long-form reading.
        */}
        <section className="py-32 md:py-48 relative">
          <header className="mb-24 flex flex-col gap-4">
            <span className="text-[10px] uppercase tracking-[0.5em] text-primary/60 font-semibold">
              02 / The Intelligence Stream
            </span>
            <h2 className="text-4xl md:text-6xl font-light tracking-tighter max-w-2xl leading-[1.1]">
              A ledger of signals from the underground.
            </h2>
          </header>

          <Suspense fallback={<div className="py-48 text-center text-[10px] tracking-[0.5em] opacity-20">SYNCING STREAM...</div>}>
            <NewsSection />
          </Suspense>
        </section>

        {/* 
            III. COMMUNITY PULSE / EXPLORATION
            The roots and foundations. Designed for discovery and contribution.
        */}
        <section className="py-32 md:py-48 border-t border-border/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-end">
            <div className="space-y-12">
              <header className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
                  03 / Community Pulse
                </span>
                <h3 className="text-3xl font-light tracking-tight">Participate in the discourse.</h3>
              </header>
              <p className="text-muted-foreground font-light leading-relaxed max-w-sm">
                Join the curated dialogue within our forums or synchronize with global performance networks.
              </p>
              <div className="flex gap-12">
                <Link href="/community/forum" className="text-[10px] uppercase tracking-[0.3em] border-b border-border hover:border-primary transition-colors pb-2">Enter Forum</Link>
                <Link href="/gigs/india" className="text-[10px] uppercase tracking-[0.3em] border-b border-border hover:border-primary transition-colors pb-2">Radar</Link>
              </div>
            </div>

            <div className="p-12 bg-muted/5 border border-border/10 space-y-8">
              <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">Studio</span>
              <h4 className="text-xl font-light">Synthesize your identity.</h4>
              <p className="text-xs text-muted-foreground/60 leading-relaxed uppercase tracking-widest font-medium">
                AI Powered Creative Tools for Artists.
              </p>
              <Link href="/ai/cover-art" className="block text-[10px] uppercase tracking-[0.3em] text-primary hover:translate-x-2 transition-transform">Begin Synthesis &rarr;</Link>
            </div>
          </div>
        </section>
      </div>

      {/* 
          IV. ARCHIVAL FOOTER
          The final anchor.
      */}
      <footer className="bg-muted/5 py-32 border-t border-border/5">
        <div className="max-w-screen-xl mx-auto px-8 flex flex-col md:flex-row justify-between gap-24">
          <div className="max-w-xs space-y-8">
            <Logo className="w-6 h-6 grayscale opacity-20" />
            <p className="text-xs leading-relaxed text-muted-foreground/40 uppercase tracking-widest font-medium">
              thecueRoom V2 &copy; {new Date().getFullYear()} / Zero Error Build / Editorial Gateway
            </p>
          </div>
          
          <div className="flex flex-wrap gap-24">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-foreground font-semibold">Vectors</span>
              <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Link href="/news" className="hover:text-primary transition-colors">Archive</Link>
                <Link href="/feeds" className="hover:text-primary transition-colors">Signals</Link>
                <Link href="/music/weekly" className="hover:text-primary transition-colors">Weekly</Link>
              </div>
            </div>
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.4em] text-foreground font-semibold">Network</span>
              <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Link href="/community/forum" className="hover:text-primary transition-colors">Forums</Link>
                <Link href="/settings" className="hover:text-primary transition-colors">Profile</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
