'use client';
import { useState, useCallback, memo, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface FeedItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
}

const FeedCard = memo(({ item, index }: { item: FeedItem; index: number }) => (
  <div className="group grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 py-8 border-b border-white/5">
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.22, 
        ease: [0.33, 1, 0.68, 1],
        delay: Math.min(index * 0.05, 0.3)
      }}
      className="contents"
    >
      <a 
        href={item.url} 
        target="_blank" 
        className="aspect-[16/10] bg-white/5 overflow-hidden relative block shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded-sm"
      >
        <img 
          src={item.image} 
          alt=""
          className="w-full h-full object-cover transition-all duration-300 filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-[1.02] contrast-[1.05]" 
        />
      </a>
      <div className="space-y-4">
        <div className="text-[10px] font-mono text-[#D1FF3D]/60 uppercase tracking-widest flex items-center gap-4">
          <span>{item.source}</span>
          <span className="text-zinc-800">/</span>
          <span suppressHydrationWarning className="text-zinc-500">
            {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </span>
        </div>
        <a href={item.url} target="_blank" className="inline-block">
          <h3 className="text-2xl font-light transition-all duration-300 relative">
            <span className="relative z-10">{item.title}</span>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#D1FF3D] transition-all duration-300 group-hover:w-full opacity-60"></span>
          </h3>
        </a>
        <p className="text-sm text-foreground/40 line-clamp-2">{item.summary}</p>
        
        <a 
          href={item.url} 
          target="_blank"
          className="inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#D1FF3D]/40 group-hover:text-[#D1FF3D] transition-colors focus:outline-none focus:text-[#D1FF3D]"
        >
          Read Signal
          <span className="transition-transform duration-300 group-hover:translate-x-1 focus:translate-x-1">→</span>
        </a>
      </div>
    </motion.article>
  </div>
));

export default function FeedUX({ initialItems = [] }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/feeds?offset=${items.length}&limit=12`);
      const data = await res.json();
      setItems(prev => [...prev, ...data.items]);
    } catch (e) {
      console.error('Failed to load signals:', e);
    } finally {
      setIsLoading(false);
    }
  }, [items.length]);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col">
        {initialItems.length > 0 ? (
          initialItems.map((item, index) => (
            <div key={item.id} className="group grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 py-8 border-b border-white/5">
              <div className="contents">
                <div className="aspect-[16/10] bg-white/5 overflow-hidden relative block shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] rounded-sm">
                  <img src={item.image} alt="" className="w-full h-full object-cover filter grayscale opacity-60 contrast-[1.05]" />
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-mono text-[#D1FF3D]/60 uppercase tracking-widest flex items-center gap-4">
                    <span>{item.source}</span>
                    <span className="text-zinc-800">/</span>
                    <span suppressHydrationWarning className="text-zinc-500">
                      {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                  <div className="inline-block">
                    <h3 className="text-2xl font-light">
                      <span className="relative z-10">{item.title}</span>
                    </h3>
                  </div>
                  <p className="text-sm text-foreground/40 line-clamp-2">{item.summary}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center border border-dashed border-white/5">
             <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/20">Awaiting transmission...</span>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-32 flex flex-col items-center justify-center border border-dashed border-white/5 space-y-8"
      >
        <div className="w-16 h-px bg-[#D1FF3D]/10" />
        <span className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#D1FF3D]/40">No news strata detected</span>
        <div className="w-16 h-px bg-[#D1FF3D]/10" />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <FeedCard key={item.id} item={item} index={index} />
      ))}
      <button onClick={loadMore} disabled={isLoading} className="mt-12 py-4 border border-white/10 text-[10px] font-mono uppercase tracking-[0.5em] hover:border-[#D1FF3D] transition-all">
        {isLoading ? 'Syncing...' : 'Load More Signals'}
      </button>
    </div>
  );
}
