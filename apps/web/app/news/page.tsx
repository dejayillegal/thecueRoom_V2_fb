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

// --- Mock Data ---
const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'The Future of Underground Synthesis',
    excerpt: 'How modular patches are redefining the sonic landscape of modern techno in 2026. A deep dive into the evolving hardware culture that powers the dance floors of tomorrow.',
    imageUrl: '/api/og-fallback?title=Synthesis',
    category: 'TECH INTELLIGENCE',
    author: 'Elena Vance',
    publishedAt: '2026-01-21',
    readTime: '12 min',
    source: 'TCR Exclusive',
    link: '#',
  },
  {
    id: '2',
    title: 'Post-Genre Movements in Bengaluru',
    excerpt: 'Bengaluru\'s electronic scene is transcending borders, blending local folk instruments with heavy bass textures. We explore the pioneers of this sub-bass revolution.',
    imageUrl: '/api/og-fallback?title=BangaloreScene',
    category: 'CULTURE',
    author: 'Karan Singh',
    publishedAt: '2026-01-20',
    readTime: '8 min',
    source: 'Regional Spotlight',
    link: '#',
  },
  {
    id: '3',
    title: 'The AI Ethics of Raving',
    excerpt: 'As facial recognition enters clubs, who really owns your dance floor identity? Analyzing the friction between privacy and security in the modern nightclub ecosystem.',
    imageUrl: '/api/og-fallback?title=ClubAI',
    category: 'POLICY',
    author: 'Sarah Jenkins',
    publishedAt: '2026-01-19',
    readTime: '15 min',
    source: 'Longform',
    link: '#',
  },
  {
    id: '4',
    title: 'Vinyl Sales Reach Decadal High',
    excerpt: 'In a digital-first world, the physical medium strikes back with record numbers.',
    imageUrl: '/api/og-fallback?title=Vinyl',
    category: 'MARKET',
    author: 'Marcus Cole',
    publishedAt: '2026-01-21',
    readTime: '4 min',
    source: 'Industry Rail',
    link: '#',
  },
  {
    id: '5',
    title: 'New Hardware: The Analog 8-Voice',
    excerpt: 'Is this the synth that finally bridges the gap between digital precision and analog warmth?',
    imageUrl: '/api/og-fallback?title=Synth',
    category: 'GEAR',
    author: 'Tech Desk',
    publishedAt: '2026-01-21',
    readTime: '6 min',
    source: 'Industry Rail',
    link: '#',
  }
];

// --- Components ---

/**
 * STRATUM 1: SIGNAL LEAD
 * One dominant story, large typography, cinematic spacing
 */
const SignalLead = ({ item }: { item: NewsItem }) => (
  <section className="relative w-full min-h-[70vh] flex flex-col justify-end bg-[#0B0B0B] overflow-hidden group">
    <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-1000">
       <Image 
        src={item.imageUrl} 
        alt={item.title}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
    </div>
    
    <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pb-16 md:pb-24 w-full">
      <div className="flex items-center gap-4 mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#D1FF3D] border border-[#D1FF3D]/30 px-2 py-1 uppercase bg-[#D1FF3D]/5">
          {item.category}
        </span>
        <span className="font-mono text-[10px] tracking-[0.1em] text-gray-500 uppercase">
          Today's Pulse
        </span>
      </div>
      
      <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter leading-[0.9] max-w-5xl mb-8 group-hover:text-[#D1FF3D] transition-colors duration-500">
        {item.title}
      </h1>
      
      <p className="text-lg md:text-2xl text-gray-400 font-light max-w-2xl mb-10 leading-relaxed">
        {item.excerpt}
      </p>
      
      <Link 
        href={item.link}
        className="inline-flex items-center gap-4 group/btn"
      >
        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover/btn:border-[#D1FF3D] group-hover/btn:bg-[#D1FF3D] transition-all duration-300">
          <ArrowRight className="w-5 h-5 group-hover/btn:text-black transition-colors" />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.2em] group-hover/btn:text-[#D1FF3D] transition-colors">
          Read Full Signal
        </span>
      </Link>
    </div>
  </section>
);

/**
 * STRATUM 2: CURATED INTELLIGENCE RAIL
 * Horizontally scrollable (snap), editorial cards
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
    <section className="bg-[#111111] py-20 border-y border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Curated Intelligence</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Weekly Industry Selection</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-[#D1FF3D] hover:text-black hover:border-[#D1FF3D] transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-8 px-6 md:px-[calc((100vw-1400px)/2+48px)] scroll-smooth"
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[320px] md:min-w-[450px] snap-start bg-[#0B0B0B] group border border-transparent hover:border-[#D1FF3D]/20 transition-all duration-500">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-8">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#873BBF] uppercase mb-4 block">
                {item.category}
              </span>
              <h3 className="text-xl font-bold text-white mb-4 leading-tight group-hover:text-[#D1FF3D] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                {item.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-500">{item.source}</span>
                <Link href={item.link} className="text-[#D1FF3D]"><ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * STRATUM 3: COMMUNITY UNDERGROUND
 * Dense scanning cards, readable but compact
 */
const CommunityUnderground = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#0B0B0B] py-24">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div className="max-w-xl">
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Underground Feed</h2>
          <p className="text-gray-400 leading-relaxed">High-frequency updates from the global electronic music collective. Real-time signal from the scene's core.</p>
        </div>
        <div className="font-mono text-[10px] text-[#D1FF3D] flex items-center gap-2 px-3 py-1.5 border border-[#D1FF3D]/30 bg-[#D1FF3D]/5">
          <span className="w-1.5 h-1.5 bg-[#D1FF3D] animate-pulse" />
          LIVE FEED ACTIVE
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-white/5">
        {items.map((item) => (
          <div key={item.id} className="p-8 border-r border-b border-white/5 hover:bg-[#111111] transition-colors group cursor-pointer">
            <div className="flex justify-between items-start mb-6">
              <span className="font-mono text-[9px] text-[#D1FF3D] tracking-[0.2em]">{item.category}</span>
              <div className="flex gap-3 text-gray-600 group-hover:text-white transition-colors">
                <Share2 size={14} />
                <ExternalLink size={14} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-4 leading-snug group-hover:text-[#D1FF3D] transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">
              {item.excerpt}
            </p>
            <div className="flex items-center gap-4 font-mono text-[10px] text-gray-600">
              <span className="flex items-center gap-1.5"><Clock size={10} /> {item.readTime}</span>
              <span>{item.author}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 flex justify-center">
        <button className="px-8 py-3 font-mono text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:border-[#D1FF3D] hover:text-[#D1FF3D] transition-all">
          Sync More Signals
        </button>
      </div>
    </div>
  </section>
);

/**
 * STRATUM 4: DEEP DIVE
 * Reading-first layout, maximize legibility
 */
const DeepDive = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#111111] py-32 border-t border-white/5">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <div className="text-center mb-24">
        <p className="font-mono text-[10px] text-[#873BBF] uppercase tracking-[0.4em] mb-4">Deep Intelligence</p>
        <h2 className="text-5xl font-bold text-white tracking-tighter">The Longform Archives</h2>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-32">
        {items.map((item, idx) => (
          <div key={item.id} className={cn(
            "flex flex-col gap-12 group",
            idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
          )}>
            <div className="w-full md:w-1/2 aspect-square relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                className="object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
              />
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center">
              <span className="font-mono text-[10px] text-gray-500 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-[1px] bg-gray-800" /> {item.publishedAt}
              </span>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tight leading-[1.1] group-hover:text-[#D1FF3D] transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
                {item.excerpt}
              </p>
              <div className="flex items-center gap-8">
                <Link href={item.link} className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] hover:underline underline-offset-8">
                  Read Investigation
                </Link>
                <span className="font-mono text-[10px] text-gray-600">{item.readTime} reading time</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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

// ... existing MOCK_NEWS ...

export default function NewsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<'none' | 'offline' | 'partial' | 'empty'>('none');
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Demo state

  useEffect(() => {
    // Simulate loading and potential state
    const timer = setTimeout(() => {
      setIsLoading(false);
      // For demo: randomly show a failure mode 10% of the time if needed, 
      // but default to 'none' for normal operation
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError('none');
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-[#D1FF3D] rounded-full animate-spin" />
          <p className="font-mono text-[10px] tracking-[0.4em] text-gray-500 animate-pulse">SYNCING SIGNALS</p>
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6">
        <AccessRestricted onLogin={() => window.location.href = '/login'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      {/* 1. SIGNAL LEAD */}
      {MOCK_NEWS.length > 0 ? (
        <SignalLead item={MOCK_NEWS[0]} />
      ) : (
        <SilenceInTheWire />
      )}
      
      {/* 2. CURATED RAIL */}
      {error === 'partial' ? (
        <div className="px-6 md:px-12 py-10">
          <PartialSync onRetry={handleRetry} />
        </div>
      ) : (
        <CuratedRail items={MOCK_NEWS.slice(1, 6)} />
      )}
      
      {/* 3. UNDERGROUND */}
      <CommunityUnderground items={MOCK_NEWS} />
      
      {/* 4. DEEP DIVE */}
      <DeepDive items={MOCK_NEWS.slice(2, 4)} />
      
      {/* Footer / Load More */}
      <footer className="py-20 text-center border-t border-white/5 bg-[#0B0B0B]">
        <p className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.2em]">End of current pulse. Stay tuned for new signal.</p>
      </footer>
    </div>
  );
}
