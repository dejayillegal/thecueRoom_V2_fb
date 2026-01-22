'use client';
import { useState, useCallback, memo } from 'react';
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
  <motion.article 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.22, 
      ease: [0.33, 1, 0.68, 1],
      delay: Math.min(index * 0.05, 0.3)
    }}
    className="group grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 py-8 border-b border-white/5"
  >
    <a 
      href={item.url} 
      target="_blank" 
      className="aspect-[16/10] bg-white/5 overflow-hidden relative block shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
    >
      <img 
        src={item.image} 
        alt=""
        className="w-full h-full object-cover transition-all duration-300 filter brightness-[0.8] contrast-[1.1] group-hover:brightness-[1.1] group-hover:contrast-[1.2] group-hover:scale-[1.02]" 
      />
    </a>
    <div className="space-y-4">
      <div className="text-[10px] font-mono text-[#D1FF3D]/60 uppercase tracking-widest flex items-center gap-2">
        {item.source}
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
        className="inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#D1FF3D]/40 group-hover:text-[#D1FF3D] transition-colors"
      >
        Read Signal
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </a>
    </div>
  </motion.article>
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
