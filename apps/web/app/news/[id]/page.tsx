'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  Share2, 
  Bookmark, 
  ChevronRight,
  User,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignalLost, SilenceInTheWire } from '@/src/components/News/NewsFailureModes';

interface NewsDetail {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  source: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<NewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch("/api/dashboard/overview", { cache: 'no-store' });
        const data = await response.json();
        
        const id = params.id as string;
        let found: NewsDetail | null = null;

        // Search in spotlight
        if (data.spotlight) {
          const spot = data.spotlight.find((s: any) => s.id === id);
          if (spot) {
            found = {
              id: spot.id,
              title: spot.title,
              excerpt: spot.subtitle || '',
              content: spot.subtitle || 'Detailed content for this intelligence signal is being synchronized across the collective.',
              imageUrl: spot.imageUrl,
              category: spot.tag || 'FEATURED',
              author: 'TCR Editorial',
              publishedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              readTime: '8 min',
              source: 'Editorial'
            };
          }
        }

        // Search in trending (if not found in spotlight)
        if (!found && data.trendingThreads) {
          const thread = data.trendingThreads.find((t: any) => t.id === id);
          if (thread) {
            found = {
              id: thread.id,
              title: thread.title,
              excerpt: `Community intelligence from ${thread.author}.`,
              content: `This signal originated from the community underground. ${thread.replies} collective members have engaged with this frequency.`,
              imageUrl: "/api/og-fallback?title=" + encodeURIComponent(thread.title),
              category: thread.category || 'COMMUNITY',
              author: thread.author,
              publishedAt: thread.createdAt ? new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString(),
              readTime: '5 min',
              source: 'Community'
            };
          }
        }

        if (found) {
          setItem(found);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch news detail:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-t-2 border-[#D1FF3D] rounded-full animate-spin" />
          <p className="font-mono text-[10px] tracking-[0.4em] text-gray-500 animate-pulse">DECRYPTING SIGNAL</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-6">
        <SignalLost onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#D1FF3D] selection:text-black">
      {/* Hero Header */}
      <header className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        <Image 
          src={item.imageUrl} 
          alt={item.title}
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-16 w-full">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D1FF3D] mb-8 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Pulse
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#D1FF3D] border border-[#D1FF3D]/30 px-2 py-1 uppercase bg-[#D1FF3D]/5">
                {item.category}
              </span>
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.1em]">
                {item.source} Signal
              </span>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold tracking-tighter leading-[0.95] max-w-5xl mb-8">
              {item.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <article className="max-w-[1400px] mx-auto px-6 md:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Sidebar Info */}
        <aside className="lg:col-span-3 space-y-12 order-2 lg:order-1">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <User size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Encoded By</p>
                <p className="text-sm font-bold text-white">{item.author}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Calendar size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Released On</p>
                <p className="text-sm font-bold text-white">{item.publishedAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                <Clock size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Reading Time</p>
                <p className="text-sm font-bold text-white">{item.readTime}</p>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5">
            <h4 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-6">Interaction</h4>
            <div className="flex gap-4">
              <button className="flex-1 py-3 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-400 hover:text-white">
                <Share2 size={14} />
                <span className="font-mono text-[10px] uppercase">Share</span>
              </button>
              <button className="flex-1 py-3 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-gray-400 hover:text-white">
                <Bookmark size={14} />
                <span className="font-mono text-[10px] uppercase">Archive</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Body */}
        <div className="lg:col-span-9 order-1 lg:order-2">
          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-xl md:text-2xl text-gray-300 font-light leading-relaxed mb-12 border-l-2 border-[#D1FF3D] pl-8 italic">
              {item.excerpt}
            </p>
            
            <div className="text-gray-400 leading-[1.8] space-y-8 font-light text-lg">
              <p>{item.content}</p>
              <p>
                The evolution of this frequency represents a significant shift in the underground collective. 
                As signals continue to propagate through the network, we observe a distinct pattern of 
                cultural resonance that transcends traditional genre boundaries.
              </p>
              <div className="my-16 aspect-video relative rounded-lg overflow-hidden border border-white/5 bg-[#111111]">
                <Image src={item.imageUrl} alt="Secondary Visual" fill className="object-cover opacity-40 grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[10px] tracking-[0.5em] text-gray-500 uppercase">Visual Stream Encoded</span>
                </div>
              </div>
              <p>
                In the coming cycles, we expect more data strata to synchronize with this lead signal. 
                ThecueRoom remains the central hub for decrypting these movements as they emerge 
                from the silence of the wire.
              </p>
            </div>
          </div>

          <div className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">Frequency Source:</span>
              <span className="px-3 py-1 bg-white/5 text-gray-400 font-mono text-[10px] uppercase tracking-wider border border-white/10">
                {item.source === 'Editorial' ? 'Internal TCR Protocol' : 'External Node Sync'}
              </span>
            </div>
            
            <Link 
              href="/news"
              className="group flex items-center gap-3 font-mono text-[10px] text-[#D1FF3D] uppercase tracking-[0.3em] hover:gap-5 transition-all"
            >
              Scan Next Signal
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-white/5 bg-[#0B0B0B]">
        <p className="font-mono text-[10px] text-gray-600 uppercase tracking-[0.2em]">End of signal synchronization. Signal ID: {item.id}</p>
      </footer>
    </div>
  );
}
