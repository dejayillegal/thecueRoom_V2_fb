"use client";

import { motion } from "framer-motion";
import { SpotlightCarousel } from "./SpotlightCarousel";
import { AIToolsBoard } from "./AIToolsBoard";
import { GigRadarWidget } from "./GigRadarWidget";
import { TrendingThreadsWidget } from "./TrendingThreadsWidget";
import { MonthlyPlaylistWidget } from "./MonthlyPlaylistWidget";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export function DashboardContent({ data }: { data: any }) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-16 relative"
    >
      {/* Immersive Graphical Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-[#9B5CFF]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#D7FF3C]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      {/* Guided Experience Flow: Welcome (Banner) -> Spotlight -> Creative Tools -> Widgets */}
      
      {/* 1. Featured Spotlight */}
      <motion.section variants={item} className="relative group">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-6 bg-[#9B5CFF] rounded-full shadow-[0_0_20px_rgba(155,92,255,0.5)]" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Featured Spotlight</h2>
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Global Industry Signals</p>
          </div>
        </div>
        <div className="rounded-[40px] overflow-hidden border border-white/10 bg-[#111111]/40 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.6)] transition-all duration-700 hover:border-[#9B5CFF]/30 ring-1 ring-white/5">
          <ErrorBoundary>
            <SpotlightCarousel items={data.spotlight || []} />
          </ErrorBoundary>
        </div>
      </motion.section>

      {/* 2. Creative Suite */}
      <motion.section variants={item} className="relative">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-1.5 h-6 bg-[#D7FF3C] rounded-full shadow-[0_0_20px_rgba(215,255,60,0.5)]" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em]">Creative Suite</h2>
            <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">AI Synthesis Engine</p>
          </div>
        </div>
        <div className="rounded-[48px] p-px bg-gradient-to-br from-white/15 via-white/5 to-transparent shadow-2xl">
          <div className="bg-[#0B0B0B]/90 backdrop-blur-2xl rounded-[47px] overflow-hidden border border-white/5">
            <ErrorBoundary>
              <AIToolsBoard />
            </ErrorBoundary>
          </div>
        </div>
      </motion.section>

      {/* 3. Community & Insights Grid */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        <div className="relative group/widget h-full">
           <div className="absolute -inset-4 bg-[#9B5CFF]/5 rounded-[48px] opacity-0 group-hover/widget:opacity-100 transition-opacity blur-3xl" />
           <ErrorBoundary>
              <GigRadarWidget />
           </ErrorBoundary>
        </div>
        <div className="relative group/widget h-full">
           <div className="absolute -inset-4 bg-white/5 rounded-[48px] opacity-0 group-hover/widget:opacity-100 transition-opacity blur-3xl" />
           <ErrorBoundary>
              <TrendingThreadsWidget />
           </ErrorBoundary>
        </div>
        <div className="relative group/widget h-full">
           <div className="absolute -inset-4 bg-[#D7FF3C]/5 rounded-[48px] opacity-0 group-hover/widget:opacity-100 transition-opacity blur-3xl" />
           <ErrorBoundary>
              <MonthlyPlaylistWidget />
           </ErrorBoundary>
        </div>
      </motion.div>
    </motion.div>
  );
}
