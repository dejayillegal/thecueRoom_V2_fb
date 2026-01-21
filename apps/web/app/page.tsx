'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/auth/AuthButton';
import SpotlightSection from '@/components/SpotlightSection';
import NewsSection from '@/components/NewsSection';
import { Logo } from '@/components/Logo';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

/**
 * ARCHITECTURAL SKELETON
 * Spatial tension during load.
 */
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="h-[70vh] bg-[#111111] border border-[#D1FF3D]/5" />
    </div>
  );
}

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

    return { 
      spotlightFeeds: spotlightData.data?.slice(0, 8) || [], 
      trendingFeeds: trendingData.data?.slice(0, 16) || [] 
    };
  } catch (error) {
    return { spotlightFeeds: [], trendingFeeds: [] };
  }
}

export default async function HomePage() {
  const { spotlightFeeds, trendingFeeds } = await fetchLandingData();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-foreground selection:bg-[#D1FF3D] selection:text-[#0B0B0B] font-inter antialiased overflow-x-hidden">
      {/* ATMOSPHERIC VECTOR: Textural noise for editorial depth */}
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-[0.03] grain-overlay" />
      
      {/* STAGING: ASYMMETRIC HEADER */}
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

      {/* I. PRIMARY SIGNAL SURFACE */}
      <section className="pt-24 min-h-[90vh] flex flex-col justify-end">
        <Suspense fallback={<SectionSkeleton />}>
          <SpotlightSection 
            initialFeeds={spotlightFeeds} 
            initialTrending={trendingFeeds} 
          />
        </Suspense>
      </section>

      {/* II. INFORMATION AS ARCHITECTURE */}
      <div className="max-w-screen-2xl mx-auto px-10">
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="py-48 md:py-64 relative"
        >
          {/* ASYMMETRIC ACCENT ELEMENT */}
          <div className="absolute -left-20 top-48 w-40 h-[1px] bg-[#D1FF3D]/20 hidden md:block" />
          
          <header className="mb-32 flex flex-col md:flex-row items-baseline gap-12 md:gap-32">
            <div className="space-y-6">
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-[10px] uppercase tracking-[0.8em] text-[#D1FF3D] font-bold font-mono"
              >
                02 / ARCHIVE
              </motion.span>
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
            <Suspense fallback={<div className="py-48 text-center text-[10px] tracking-[0.8em] opacity-10 font-mono uppercase">Initializing Stream...</div>}>
              <NewsSection />
            </Suspense>
            
            <aside className="hidden xl:block w-px bg-gradient-to-b from-[#D1FF3D]/20 via-transparent to-transparent h-[800px] sticky top-48" />
          </div>
        </motion.section>

        {/* III. SPATIAL TENSION: STUDIO & COMMUNITY */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="py-48 md:py-64 border-t border-[#D1FF3D]/10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-48 items-start">
            <div className="space-y-24">
              <header className="space-y-8">
                <span className="text-[10px] uppercase tracking-[0.8em] text-muted-foreground font-mono">
                  03 / NETWORK
                </span>
                <motion.h3 
                  initial={{ filter: "blur(10px)", opacity: 0 }}
                  whileInView={{ filter: "blur(0px)", opacity: 1 }}
                  transition={{ duration: 1.2 }}
                  className="text-4xl md:text-6xl font-extralight tracking-tight leading-tight"
                >
                  Discourse is the <br /> 
                  <span className="font-normal text-[#873BBF]">Primary Output.</span>
                </motion.h3>
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

            <motion.div 
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative p-16 bg-[#111111] border border-[#D1FF3D]/5 group overflow-hidden"
            >
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
            </motion.div>
          </div>
        </motion.section>
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
