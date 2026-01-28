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
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { SignalLost, SilenceInTheWire, PartialSync, AccessRestricted } from '@/src/components/News/NewsFailureModes';

// --- Motion Variants ---
const fADE_IN_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const sTAGGER_CONTAINER = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
const SignalLead = ({ item }: { item: NewsItem }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative w-full min-h-[85vh] flex flex-col justify-end bg-[#0B0B0B] overflow-hidden group">
      <motion.div 
        style={ { y, opacity } }
        className="absolute inset-0 transition-transform duration-[2000ms] group-hover:scale-105"
      >
         <Image 
          src={item.imageUrl} 
          alt={item.title}
          fill
          className="object-cover opacity-50 contrast-125 saturate-[0.8]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-transparent to-transparent opacity-60" />
      </motion.div>
      
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pb-20 md:pb-32 w-full text-left">
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={ { once: true } }
          variants={sTAGGER_CONTAINER}
          className="flex flex-col items-start"
        >
          <motion.div variants={fADE_IN_UP} className="flex items-center gap-4 mb-8">
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
          </motion.div>
          
          <motion.h1 
            variants={fADE_IN_UP}
            className="text-4xl md:text-[6rem] font-bold text-white tracking-tighter leading-[0.85] max-w-7xl mb-12 group-hover:text-[#D1FF3D] transition-colors duration-700 break-words"
            style={{ minWidth: 'min-content', textWrap: 'balance' }}
          >
            {item.title}
          </motion.h1>
          
          <motion.div 
            variants={fADE_IN_UP}
            className="flex flex-col md:flex-row md:items-end justify-between gap-12 w-full"
          >
            <p className="text-lg md:text-2xl text-gray-400 font-light max-w-3xl leading-tight">
              {item.excerpt}
            </p>
            
            <Link 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-6 group/btn"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60 group-hover/btn:text-[#D1FF3D] transition-colors">
                Decrypt Full Signal
              </span>
              <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover/btn:border-[#D1FF3D] group-hover/btn:bg-[#D1FF3D] transition-all duration-500">
                <ArrowRight className="w-6 h-6 text-white group-hover/btn:text-black transition-colors" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-12 right-12 hidden md:block">
        <div className="font-mono text-[8px] text-white/20 vertical-rl tracking-[0.5em] uppercase">
          TCR_EDITORIAL_SIGNAL_001
        </div>
      </div>
    </section>
  );
};

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
      <motion.div 
        initial="initial"
        whileInView="animate"
        viewport={ { once: true, margin: "-100px" } }
        variants={sTAGGER_CONTAINER}
        className="max-w-[1400px] mx-auto px-6 md:px-12 mb-20 flex items-end justify-between"
      >
        <motion.div variants={fADE_IN_UP} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[#873BBF]" />
            <h2 className="text-4xl font-bold text-white tracking-tight italic">Intelligence Rail</h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-gray-500">Curated by the cueRoom editorial collective</p>
        </motion.div>
        <motion.div variants={fADE_IN_UP} className="flex gap-4">
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
        </motion.div>
      </motion.div>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-12 px-6 md:px-[calc((100vw-1400px)/2+48px)] scroll-smooth"
      >
        {items.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={ { opacity: 0, x: 50 } }
            whileInView={ { opacity: 1, x: 0 } }
            viewport={ { once: true } }
            transition={ { delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
            className="min-w-[340px] md:min-w-[580px] snap-start bg-[#0B0B0B] group flex flex-col"
          >
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
              <Link 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <h3 className="text-2xl md:text-4xl font-bold text-white mb-6 leading-[1.1] group-hover:text-[#D1FF3D] transition-colors">
                  {item.title}
                </h3>
              </Link>
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
                <Link 
                  href={item.link} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#D1FF3D] transition-colors"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/**
 * STRATUM 3: THE UNDERGROUND (Scanner View)
 */
const CommunityUnderground = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#0B0B0B] py-32">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <motion.div 
        initial="initial"
        whileInView="animate"
        viewport={ { once: true, margin: "-100px" } }
        variants={sTAGGER_CONTAINER}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-24"
      >
        <motion.div variants={fADE_IN_UP} className="max-w-2xl">
          <h2 className="text-5xl font-bold text-white tracking-tighter mb-6 underline decoration-[#D1FF3D] decoration-2 underline-offset-8">The Underground</h2>
          <p className="text-gray-400 text-xl leading-relaxed font-light">High-frequency community signals decrypted in real-time. This is the raw pulse of the electronic music collective.</p>
        </motion.div>
        <motion.div variants={fADE_IN_UP}>
          <Link href="/news" className="font-mono text-[10px] text-[#D1FF3D] uppercase tracking-[0.5em] flex items-center gap-3 hover:gap-5 transition-all">
            Access Nodes <ChevronRight size={14} />
          </Link>
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-24">
        {items.map((item, idx) => (
          <motion.div 
            key={item.id} 
            initial={ { opacity: 0, y: 30 } }
            whileInView={ { opacity: 1, y: 0 } }
            viewport={ { once: true } }
            transition={ { delay: idx * 0.05, duration: 0.6 } }
            className="group cursor-pointer"
            onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
          >
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
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/**
 * STRATUM 4: DEEP INVESTIGATIONS
 */
const DeepDive = ({ items }: { items: NewsItem[] }) => (
  <section className="bg-[#111111] py-48 border-t border-white/5">
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
      <motion.div 
        initial={ { opacity: 0, scale: 0.95 } }
        whileInView={ { opacity: 1, scale: 1 } }
        viewport={ { once: true } }
        transition={ { duration: 1, ease: [0.16, 1, 0.3, 1] } }
        className="max-w-4xl mx-auto text-center mb-32"
      >
        <h2 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-none">Deep Investigations</h2>
        <div className="h-[2px] w-24 bg-[#D1FF3D] mx-auto mb-8" />
        <p className="font-mono text-[11px] text-gray-500 uppercase tracking-[0.6em]">Longform editorial archives</p>
      </motion.div>
      
      <div className="max-w-5xl mx-auto space-y-48">
        {items.map((item, idx) => (
          <div key={item.id} className={cn(
            "flex flex-col gap-20 group",
            idx % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
          )}>
            <motion.div 
              initial={ { opacity: 0, scale: 1.1 } }
              whileInView={ { opacity: 1, scale: 1 } }
              viewport={ { once: true } }
              transition={ { duration: 1.2 } }
              className="w-full md:w-1/2 aspect-[4/5] relative overflow-hidden"
            >
              <Image 
                src={item.imageUrl} 
                alt={item.title}
                fill
                className="object-cover saturate-0 group-hover:saturate-100 transition-all duration-[1500ms]"
              />
              <div className="absolute inset-0 bg-[#0B0B0B]/20 mix-blend-overlay" />
            </motion.div>
            <motion.div 
              initial={ { opacity: 0, x: idx % 2 === 1 ? -50 : 50 } }
              whileInView={ { opacity: 1, x: 0 } }
              viewport={ { once: true } }
              transition={ { duration: 1, delay: 0.2 } }
              className="w-full md:w-1/2 flex flex-col justify-center"
            >
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
            </motion.div>
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
        const response = await fetch("/api/feeds?limit=50", { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const allItems: NewsItem[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          title: item.title,
          excerpt: item.summary || '',
          imageUrl: item.image || '',
          category: item.tags?.[0] || 'EDITORIAL',
          author: 'TCR Editorial',
          publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          readTime: '12 min',
          source: item.source || 'Editorial',
          link: item.url || '#'
        }));

        // TCR Editorial: Filter for specific keywords or high-relevance sources
        const editorialKeywords = ['electronic', 'techno', 'house', 'ambient', 'experimental', 'underground', 'club'];
        const curatedEditorial = allItems.filter(item => 
          editorialKeywords.some(kw => 
            item.title.toLowerCase().includes(kw) || 
            item.excerpt.toLowerCase().includes(kw)
          )
        );

        // The Underground: Community & Artist movements (remaining items or specific sources)
        const undergroundItems = allItems.filter(item => !curatedEditorial.includes(item));
        
        if (allItems.length === 0) {
          setError('empty');
        } else {
          // Fill based on what we have, fallback to allItems if filters are too restrictive
          setNewsItems(allItems); 
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
    // Simulate real re-fetch would go here
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleLogin = () => {
    window.location.href = '/login';
  };

  const isLoggedIn = true; // Temporary bypass for rendering hardening as per instructions

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="loader"
          initial={ { opacity: 1 } }
          exit={ { opacity: 0 } }
          className="min-h-screen bg-[#0B0B0B] flex items-center justify-center pl-[280px]"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-[1px] bg-[#D1FF3D] animate-pulse" />
            <p className="font-mono text-[10px] tracking-[0.5em] text-[#D1FF3D] animate-pulse uppercase">Syncing Signals</p>
          </div>
        </motion.div>
      ) : error === 'offline' ? (
        <motion.div key="offline" initial={ { opacity: 0 } } animate={ { opacity: 1 } } className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6 pl-[280px]">
          <div className="max-w-2xl w-full">
            <SignalLost onRetry={handleRetry} />
          </div>
        </motion.div>
      ) : error === 'empty' ? (
        <motion.div key="empty" initial={ { opacity: 0 } } animate={ { opacity: 1 } } className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6 pl-[280px]">
          <div className="max-w-2xl w-full">
            <SilenceInTheWire />
          </div>
        </motion.div>
      ) : !isLoggedIn ? (
        <motion.div key="unauthorized" initial={ { opacity: 0 } } animate={ { opacity: 1 } } className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6 pl-[280px]">
          <div className="max-w-2xl w-full">
            <AccessRestricted onLogin={handleLogin} />
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black md:pl-[280px] overflow-x-hidden"
        >
          {/* 1. SIGNAL LEAD */}
          {newsItems.length > 0 ? (
            <SignalLead item={newsItems[0]} />
          ) : (
             <div className="pt-32 px-6 max-w-[1400px] mx-auto">
               <SilenceInTheWire />
             </div>
          )}
          
          {/* 2. INTELLIGENCE RAIL */}
          {newsItems.length > 1 && (
            <CuratedRail items={newsItems.slice(1, 6)} />
          )}
          
          {/* 3. THE UNDERGROUND */}
          {newsItems.length > 6 && (
            <CommunityUnderground items={newsItems.slice(6, 12)} />
          )}
          
          {/* 4. DEEP INVESTIGATIONS */}
          {newsItems.length > 12 && (
            <DeepDive items={newsItems.slice(12, 15)} />
          )}
          
          {/* Footer */}
          <footer className="py-32 text-center border-t border-white/5 bg-[#0B0B0B]">
            <div className="max-w-lg mx-auto space-y-8">
              <div className="w-8 h-[2px] bg-white/20 mx-auto" />
              <p className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.5em] leading-loose">
                End of current intelligence cycle.<br />
                Next signal synchronization in 04:00:00.
              </p>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
