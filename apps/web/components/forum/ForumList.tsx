'use client';

import { useState } from 'react';
import { CategorySidebar } from './CategorySidebar';
import { ThreadsList } from './ThreadsList';
import { ForumSidebar } from './ForumSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Plus } from 'lucide-react';
import Link from 'next/link';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export function ForumList() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#9B5CFF]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-[#D1FF3D]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-[1600px] mx-auto px-3 sm:px-6 py-4 sm:py-10 relative z-10"
      >
        <motion.div variants={item} className="flex items-center justify-between gap-3 mb-6 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-1 sm:w-1.5 h-6 sm:h-8 bg-[#D1FF3D] rounded-full shadow-[0_0_20px_rgba(209,255,61,0.4)]" />
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-lg sm:text-3xl font-black uppercase tracking-[0.15em] sm:tracking-[0.3em] text-white italic">Community Hall</h1>
              <p className="text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] sm:tracking-[0.4em]">Multi-Signal Frequency Discussion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/community/forum/compose"
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#D1FF3D] text-black text-[10px] font-black uppercase tracking-wider rounded-full"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">New</span>
            </Link>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mb-6 overflow-hidden"
            >
              <div className="bg-[#111111]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                <CategorySidebar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-10">
          <motion.div variants={item} className="lg:col-span-2 hidden lg:block">
            <div className="sticky top-24">
              <CategorySidebar />
            </div>
          </motion.div>

          <motion.div variants={item} className="lg:col-span-7">
            <ThreadsList />
          </motion.div>

          <motion.div variants={item} className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-8">
              <div className="p-px rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-transparent shadow-2xl">
                <div className="bg-[#111111]/60 backdrop-blur-xl rounded-[31px] overflow-hidden border border-white/5">
                  <ForumSidebar />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
