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

const FeedCard = memo(({ item }: { item: FeedItem }) => (
  <motion.article 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="group grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 py-8 border-b border-white/5"
  >
    <a href={item.url} target="_blank" className="aspect-[16/10] bg-white/5 overflow-hidden">
      <img src={item.image} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
    </a>
    <div className="space-y-4">
      <div className="text-[10px] font-mono text-[#D1FF3D]/60 uppercase tracking-widest">{item.source}</div>
      <a href={item.url} target="_blank">
        <h3 className="text-2xl font-light hover:text-[#D1FF3D] transition-colors">{item.title}</h3>
      </a>
      <p className="text-sm text-foreground/40 line-clamp-2">{item.summary}</p>
    </div>
  </motion.article>
));

export default function FeedUX({ initialItems = [] }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(`/api/feeds?offset=${items.length}&limit=12`);
    const data = await res.json();
    setItems(prev => [...prev, ...data.items]);
    setIsLoading(false);
  }, [items.length]);

  return (
    <div className="flex flex-col">
      {items.map(item => <FeedCard key={item.id} item={item} />)}
      <button onClick={loadMore} disabled={isLoading} className="mt-12 py-4 border border-white/10 text-[10px] font-mono uppercase tracking-[0.5em] hover:border-[#D1FF3D] transition-all">
        {isLoading ? 'Syncing...' : 'Load More Signals'}
      </button>
    </div>
  );
}
