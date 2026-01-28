'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Music, Hash, Activity, Zap, Star } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'all', name: 'All Signals', icon: Activity, color: '#D1FF3D' },
  { id: 'gear', name: 'Hardware', icon: Hash, color: '#9B5CFF' },
  { id: 'production', name: 'Studio', icon: Music, color: '#D1FF3D' },
  { id: 'industry', name: 'Industry', icon: Zap, color: '#9B5CFF' },
  { id: 'culture', name: 'Culture', icon: Star, color: '#D1FF3D' },
];

export function CategorySidebar() {
  const [active, setActive] = useState('all');

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-600 mb-6 pl-4">Frequencies</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`
                w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-500 group
                ${active === cat.id 
                  ? 'bg-white/5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
                  : 'hover:bg-white/[0.02] border border-transparent'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-1.5 h-1.5 rounded-full transition-all duration-700" 
                  style={{ 
                    backgroundColor: cat.color,
                    boxShadow: active === cat.id ? `0 0 15px ${cat.color}` : 'none'
                  }} 
                />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${active === cat.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  {cat.name}
                </span>
              </div>
              <ChevronRight className={`w-3 h-3 transition-all duration-500 ${active === cat.id ? 'text-[#D1FF3D] translate-x-0' : 'text-zinc-800 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="relative group/promo overflow-hidden rounded-[32px] p-6 bg-[#111111]/40 border border-white/5 backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/promo:opacity-30 transition-opacity">
          <Music className="w-8 h-8 text-[#9B5CFF]" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-3 flex items-center gap-2">
          <Zap className="w-3 h-3 text-[#D1FF3D]" />
          Signal Boost
        </h4>
        <p className="text-[10px] text-zinc-500 font-light leading-relaxed mb-6 italic">
          Verified artists receive priority frequency placement and enhanced visibility.
        </p>
        <Link 
          href="/community/forum/compose"
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#D1FF3D] hover:bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-500 shadow-lg shadow-[#D1FF3D]/10"
        >
          New Signal
        </Link>
      </div>
    </div>
  );
}
