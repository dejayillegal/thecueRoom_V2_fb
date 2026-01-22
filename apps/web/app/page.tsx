'use client';

import { Suspense, lazy } from 'react';
import SpotlightSection from '@/components/SpotlightSection';
import { Logo } from '@/components/Logo';
import { AuthButton } from '@/components/auth/AuthButton';

// Lazy load feed for performance
const FeedUX = lazy(() => import('@/components/FeedUX'));

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] text-foreground selection:bg-[#D1FF3D] selection:text-[#0B0B0B]">
      {/* Editorial Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0B0B0B]/40 backdrop-blur-3xl border-b border-white/5">
        <nav className="max-w-screen-2xl mx-auto px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <Logo className="w-8 h-8 transition-transform duration-700 group-hover:rotate-[360deg]" />
            <span className="text-sm font-light tracking-[0.4em] uppercase">thecueRoom</span>
          </div>
          
          <div className="flex items-center gap-12">
            <div className="hidden md:flex items-center gap-12 text-[10px] font-mono uppercase tracking-[0.6em] text-foreground/40">
            </div>
            <AuthButton />
          </div>
        </nav>
      </header>

      {/* Hero / Spotlight */}
      <div className="pt-20">
        <SpotlightSection initialFeeds={[]} initialTrending={[]} />
      </div>

      {/* Main Feed Content */}
      <Suspense fallback={<div className="h-[40vh] bg-[#0B0B0B]" />}>
        <FeedUX />
      </Suspense>

      {/* Production Footer - Minimalist */}
      <footer className="border-t border-white/5 py-32 bg-[#080808]">
        <div className="max-w-screen-2xl mx-auto px-10 flex flex-col md:flex-row justify-between items-start gap-24">
          <div className="space-y-12 max-w-md">
            <div className="flex items-center gap-4">
              <Logo className="w-6 h-6 grayscale opacity-40" />
              <span className="text-xs font-light tracking-[0.4em] uppercase opacity-40">thecueRoom</span>
            </div>
            <p className="text-sm font-light leading-relaxed text-foreground/20 italic">
              A central hub for music signals, creative tools, and underground discourse. 
              Built for the technical precision and editorial calm of the modern musician.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-24">
            <div className="space-y-8">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#D1FF3D]/40">Network</h4>
              <ul className="space-y-4 text-[11px] font-light tracking-widest uppercase text-foreground/40">
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">About</li>
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">Terms</li>
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">Privacy</li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#D1FF3D]/40">Connect</h4>
              <ul className="space-y-4 text-[11px] font-light tracking-widest uppercase text-foreground/40">
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">Discord</li>
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">Instagram</li>
                <li className="hover:text-[#D1FF3D] cursor-pointer transition-colors">Twitter</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-screen-2xl mx-auto px-10 mt-32 flex justify-between items-center text-[9px] font-mono uppercase tracking-[1em] text-white/5">
          <span>© 2026 THECUEROOM</span>
          <span>STABLE_BUILD_V2.0</span>
        </div>
      </footer>
    </main>
  );
}
