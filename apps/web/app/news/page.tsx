'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Share2, 
  ExternalLink 
} from 'lucide-react';
import { SignalLost, SilenceInTheWire, PartialSync, AccessRestricted } from '@/src/components/News/NewsFailureModes';

// --- Types ---
interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  source: string;
  link: string;
}

// --- Components ---

/**
 * STRATUM 1: SIGNAL LEAD (Hero Section)
 * One dominant story, massive typography, cinematic spacing
 */
const SignalLead = ({ item }: { item: NewsItem }) => (
  <section className="relative w-full min-h-[85vh] flex flex-col justify-end bg-[#0B0B0B] overflow-hidden group">
    <div className="absolute inset-0 transition-transform duration-[2000ms] group-hover:scale-110">
       <Image 
        src={item.imageUrl} 
        alt={item.title}
        fill
        className="object-cover opacity-50 contrast-125 saturate-[0.8]"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-transparent to-transparent opacity-60" />
    </div>
    
    <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pb-20 md:pb-32 w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D1FF3D] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#D1FF3D] uppercase">
            Lead Signal
          </span>
        </div>
        <div className="h-[1px] w-12 bg-white/20" />
        <span className="font-mono text-[10px] tracking-[0.1em] text-gray-500 uppercase">
          Synced 04:00 Zulu
        </span>
      </div>
      
      <h1 className="text-6xl md:text-[10rem] font-bold text-white tracking-tighter leading-[0.85] max-w-6xl mb-12 group-hover:text-[#D1FF3D] transition-colors duration-700">
        {item.title}
      </h1>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <p className="text-xl md:text-3xl text-gray-400 font-light max-w-3xl leading-tight">
          {item.excerpt}
        </p>
        
        <Link 
          href={item.link}
          className="flex-shrink-0 inline-flex items-center gap-6 group/btn"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/60 group-hover/btn:text-[#D1FF3D] transition-colors">
            Decrypt Full Signal
          </span>
          <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover/btn:border-[#D1FF3D] group-hover/btn:bg-[#D1FF3D] transition-all duration-500">
            <ArrowRight className="w-6 h-6 text-white group-hover/btn:text-black transition-colors" />
          </div>
        </Link>
      </div>
    </div>
    
    {/* Decorative corner element */}
    <div className="absolute bottom-12 right-12 hidden md:block">
      <div className="font-mono text-[8px] text-white/20 vertical-rl tracking-[0.5em] uppercase">
        TCR_EDITORIAL_SIGNAL_001
      </div>
    </div>
  </section>
);

/**
 * STRATUM 2: THE INTELLIGENCE RAIL
 * Weighted horizontal scroll, magazine-style cards
 */
const CuratedRail = ({ items }: { items: NewsItem[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#111111] py-32 overflow-hidden border-y border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-20 flex items-end justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#873BBF]" />
            <h2 className="text-4xl font-bold text-white tracking-tight italic">Intelligence Rail</h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-500">Curated by the cueRoom editorial collective</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => scroll('left')}
            className="w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group"
          >
            <ChevronLeft size={24} className="text-gray-500 group-hover:text-white" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-[#D1FF3D] hover:border-[#D1FF3D] transition-all group"
          >
            <ChevronRight size={24} className="text-gray-500 group-hover:text-black" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-12 px-6 md:px-[calc((100vw-1400px)/2+48px)] scroll-smooth"
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[340px] md:min-w-[580px] snap-start bg-[#0B0B0B] group flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                className="object-cover grayscale-0 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6">
                 <span className="bg-[#0B0B0B] text-[#D1FF3D] font-mono text-[9px] px-3 py-1 tracking-widest uppercase border border-[#D1FF3D]/30">
                  {item.category}
                </span>
              </div>
            </div>
            <div className="p-10 flex-1 flex flex-col">
              <h3 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-[1.1] group-hover:text-[#D1FF3D] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 line-clamp-3 font-light">
                {item.excerpt}
              </p>
              <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#111111] border border-white/5 flex items-center justify-center">
                    <Clock size={12} className="text-gray-500" />
                  </div>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{item.readTime} Read</span>
                </div>
                <Link href={item.link} className="text-white hover:text-[#D1FF3D] transition-colors">
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * STRATUM 3: THE UNDERGROUND (Scanner View)
 * Dense, typography-heavy grid, no borders on cards
 */
const CommunityUnderground = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#0B0B0B] py-32">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-24">
        <div className="max-w-2xl">
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-6 underline decoration-[#D1FF3D] decoration-2 underline-offset-8">The Underground</h2>
          <p className="text-gray-400 text-xl leading-relaxed font-light">High-frequency community signals decrypted in real-time. This is the raw pulse of the electronic music collective.</p>
        </div>
        <Link href="/forum" className="font-mono text-[10px] text-[#D1FF3D] uppercase tracking-[0.5em] flex items-center gap-3 hover:gap-5 transition-all">
          Access Nodes <ChevronRight size={14} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-24">
        {items.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[9px] text-[#873BBF] tracking-[0.3em] uppercase">{item.category}</span>
                <div className="flex-1 h-[1px] bg-white/5" />
                <span className="font-mono text-[9px] text-gray-600">ID: {item.id.slice(0, 8)}</span>
              </div>
              <h3 className="text-2xl font-bold text-white leading-snug group-hover:text-[#D1FF3D] transition-colors">
                {item.title}
              </h3>
            </div>
            <p className="text-gray-500 leading-relaxed mb-8 line-clamp-3 font-light">
              {item.excerpt}
            </p>
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-[#111111] border border-white/5" />
                 <span className="font-mono text-[10px] text-gray-600 uppercase tracking-wider">{item.author}</span>
              </div>
              <div className="flex gap-4">
                <Share2 size={14} className="text-gray-700 hover:text-white transition-colors" />
                <ExternalLink size={14} className="text-gray-700 hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/**
 * STRATUM 4: DEEP INVESTIGATIONS
 * Maximum legibility, reading-first layout, aggressive negative space
 */
const DeepDive = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#111111] py-48 border-t border-white/5">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="max-w-4xl mx-auto text-center mb-32">
        <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-none">Deep Investigations</h2>
        <div className="h-[2px] w-24 bg-[#D1FF3D] mx-auto mb-8" />
        <p className="font-mono text-[11px] text-gray-500 uppercase tracking-[0.6em]">Longform editorial archives</p>
      </div>
      
      <div className="max-w-5xl mx-auto space-y-48">
        {items.map((item, idx) => (
          <div key={item.id} className={cn(
            "flex flex-col gap-20 group",
            idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
          )}>
            <div className="w-full md:w-1/2 aspect-[4/5] relative overflow-hidden">
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                className="object-cover scale-110 group-hover:scale-100 transition-transform duration-[1500ms] saturate-0 group-hover:saturate-100"
              />
              <div className="absolute inset-0 bg-[#0B0B0B]/20 mix-blend-overlay" />
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <span className="font-mono text-[11px] text-[#873BBF] mb-10 uppercase tracking-[0.4em] block">
                Investigative Report
              </span>
              <h3 className="text-4xl md:text-6xl font-bold text-white mb-10 tracking-tight leading-[0.95] group-hover:text-[#D1FF3D] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 text-xl md:text-2xl leading-relaxed mb-12 font-light italic border-l-2 border-white/10 pl-8">
                {item.excerpt}
              </p>
              <div className="flex items-center gap-12">
                <Link href={item.link} className="font-mono text-[11px] uppercase tracking-[0.4em] text-white hover:text-[#D1FF3D] underline underline-offset-[12px] decoration-white/20 hover:decoration-[#D1FF3D]">
                  Decrypt File
                </Link>
                <div className="flex items-center gap-3">
                   <Clock size={14} className="text-gray-600" />
                   <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">{item.readTime} decrypt time</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<'none' | 'offline' | 'partial' | 'empty'>('none');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/overview", { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const combinedItems: NewsItem[] = [];
        
        if (data.spotlight && data.spotlight.length > 0) {
          combinedItems.push(...data.spotlight.map((item: any) => ({
            id: item.id,
            title: item.title,
            excerpt: item.subtitle || '',
            imageUrl: item.imageUrl,
            category: item.tag || 'EDITORIAL',
            author: 'TCR Editorial',
            publishedAt: new Date().toISOString().split('T')[0],
            readTime: '12 min',
            source: 'Editorial',
            link: `/news/${item.id}`
          })));
        }
        
        if (data.trendingThreads && data.trendingThreads.length > 0) {
          combinedItems.push(...data.trendingThreads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            excerpt: `Community intelligence decrypted from the underground node. High frequency engagement detected.`,
            imageUrl: "/api/og-fallback?title=" + encodeURIComponent(thread.title),
            category: thread.category || 'COMMUNITY',
            author: thread.author,
            publishedAt: thread.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            readTime: '6 min',
            source: 'Community',
            link: `/news/${thread.id}`
          })));
        }

        if (combinedItems.length === 0) {
          setError('empty');
        } else {
          setNewsItems(combinedItems);
        }
      } catch (err) {
        console.error("Failed to fetch news signal:", err);
        setError('offline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError('none');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-[1px] bg-[#D1FF3D] animate-pulse" />
          <p className="font-mono text-[10px] tracking-[0.5em] text-[#D1FF3D] animate-pulse uppercase">Syncing Signals</p>
        </div>
      </div>
    );
  }

  if (error === 'offline') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6">
        <SignalLost onRetry={handleRetry} />
      </div>
    );
  }

  if (error === 'empty') {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6">
        <SilenceInTheWire />
      </div>
    );
  }

  const editorialItems = newsItems.filter(item => item.source === 'Editorial');
  const communityItems = newsItems.filter(item => item.source === 'Community');

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      {/* 1. SIGNAL LEAD (Primary Spotlight) */}
      {editorialItems.length > 0 && (
        <SignalLead item={editorialItems[0]} />
      )}
      
      {/* 2. INTELLIGENCE RAIL (Remaining Spotlights) */}
      {editorialItems.length > 1 && (
        <CuratedRail items={editorialItems.slice(1)} />
      )}
      
      {/* 3. THE UNDERGROUND (Community Pulse) */}
      <CommunityUnderground items={communityItems} />
      
      {/* 4. DEEP INVESTIGATIONS (Editorial Longform) */}
      {editorialItems.length > 0 && (
        <DeepDive items={editorialItems.slice(0, 3)} />
      )}
      
      {/* Footer Terminal */}
      <footer className="py-32 text-center border-t border-white/5 bg-[#0B0B0B]">
        <div className="max-w-lg mx-auto space-y-8">
          <div className="w-8 h-[2px] bg-white/20 mx-auto" />
          <p className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.5em] leading-loose">
            End of current intelligence cycle.<br />
            Next signal synchronization in 04:00:00.
          </p>
        </div>
      </footer>
    </div>
  );
}
