"use client";

import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpotlightItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
  tag?: string;
}

export function SpotlightCarousel({ items }: { items: SpotlightItem[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items, isPaused]);

  if (!items.length) {
    return (
      <div className="h-[400px] flex items-center justify-center text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
        No active signals detected
      </div>
    );
  }

  const current = items[index];

  return (
    <div 
      className="relative h-[450px] w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <div
          key={current.id}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full"
          >
            <img 
              src={current.imageUrl} 
              className="w-full h-full object-cover grayscale opacity-40 mix-blend-luminosity"
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
          </motion.div>
        </div>
      </AnimatePresence>

      <div className="absolute inset-0 p-12 flex flex-col justify-end">
        <div
          key={current.id + "content"}
          className="max-w-2xl space-y-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {current.tag && (
              <span className="inline-block px-3 py-1 bg-[#D7FF3C] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                {current.tag}
              </span>
            )}
            <h3 className="text-4xl md:text-5xl font-light tracking-tighter leading-none text-white italic">
              {current.title}
            </h3>
            <p className="text-sm text-zinc-400 font-light max-w-lg leading-relaxed line-clamp-2">
              {current.subtitle}
            </p>
            <div className="pt-6">
              <Link 
                href={current.link}
                className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-[#D7FF3C] hover:text-white transition-colors group/btn"
              >
                Access Data <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-12 right-12 flex gap-4">
        <button 
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          className="p-3 rounded-full border border-white/10 hover:border-[#D7FF3C]/40 hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button 
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          className="p-3 rounded-full border border-white/10 hover:border-[#D7FF3C]/40 hover:bg-white/5 transition-all"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
        <motion.div 
          key={index}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 6, ease: "linear" }}
          className="h-full bg-[#D7FF3C] origin-left"
        />
      </div>
    </div>
  );
}
