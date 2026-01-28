'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, MapPin, ExternalLink, Search, Filter, 
  Music2, Loader2, Sparkles, Clock, Info, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Gig {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  ticketUrl?: string;
  freeTicket: boolean;
  imageUrl?: string;
  description?: string;
  sourceName?: string;
  category?: string;
}

export default function IndiaGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await fetch('/api/gigs/india', { cache: 'no-store' });
      const data = await response.json();
      
      // Ensure we handle both 'gigs' and 'events' keys if API changes
      const rawGigs = data.gigs || data.events || [];
      
      // Sort by date ascending
      const sortedGigs = [...rawGigs].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setGigs(sortedGigs);
      setFilteredGigs(sortedGigs);
    } catch (error) {
      console.error('Failed to fetch gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = [...gigs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (gig) =>
          gig.title.toLowerCase().includes(query) ||
          gig.venue.toLowerCase().includes(query) ||
          gig.city.toLowerCase().includes(query)
      );
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter((gig) => gig.city === selectedCity);
    }

    setFilteredGigs(filtered);
  };

  const cities = ['all', ...Array.from(new Set(gigs.map((g) => g.city)))];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let timeLabel = '';
    if (diffDays === 0) {
      timeLabel = 'Today';
    } else if (diffDays === 1) {
      timeLabel = 'Tomorrow';
    } else if (diffDays > 0 && diffDays <= 7) {
      timeLabel = `In ${diffDays} days`;
    }

    return {
      formatted: date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      timeLabel,
    };
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <div className="grain-overlay" />
      
      <header className="sticky top-0 z-50 bg-[#0b0b0b]/95 border-b border-[#222] backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] bg-clip-text text-transparent">
              thecueRoom
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D7FF3C]/20 to-[#9B5CFF]/20 flex items-center justify-center border border-[#D7FF3C]/30">
              <Music2 className="w-6 h-6 text-[#D7FF3C]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">India Gigs</h1>
              <p className="text-gray-400">Discover upcoming electronic music events across India</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by event, venue, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111] border-[#333] text-white placeholder:text-gray-500 h-12"
              />
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCity === city
                        ? 'bg-[#D7FF3C] text-black'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] border border-[#333]'
                    }`}
                  >
                    {city === 'all' ? 'All Cities' : city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{filteredGigs.length} events found</span>
            </div>
            {filteredGigs.filter((g) => g.freeTicket).length > 0 && (
              <div className="flex items-center gap-2 text-[#D7FF3C]">
                <Sparkles className="w-4 h-4" />
                <span>{filteredGigs.filter((g) => g.freeTicket).length} free events</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#D7FF3C] mb-4" />
            <p className="text-gray-400">Loading events...</p>
          </div>
        ) : filteredGigs.length === 0 ? (
          <Card className="bg-[#111] border-[#222] p-12">
            <div className="text-center">
              <Info className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || selectedCity !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Check back soon for upcoming events'}
              </p>
              {(searchQuery || selectedCity !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCity('all');
                  }}
                  className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGigs.map((gig, idx) => {
              const { formatted, timeLabel } = formatDate(gig.date);
              return (
                <motion.div
                  key={gig.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                >
                  <Card
                    className="bg-[#111] border-[#222] overflow-hidden group hover:border-[#D7FF3C]/30 transition-all duration-500 transform hover:-translate-y-2 h-full flex flex-col shadow-2xl"
                  >
                    <div className="relative aspect-[16/10] bg-[#0b0b0b] overflow-hidden">
                      {gig.imageUrl ? (
                        <img
                          src={gig.imageUrl}
                          alt={gig.title}
                          className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                          <Music2 className="w-16 h-16 text-gray-800" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                      
                      {/* Date Overlay */}
                      <div className="absolute top-4 left-4 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md border border-white/10 w-12 h-14 rounded-lg">
                        <span className="text-[10px] font-mono text-[#D7FF3C] uppercase tracking-tighter">
                          {new Date(gig.date).toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold text-white leading-none">
                          {new Date(gig.date).getDate()}
                        </span>
                      </div>

                      {gig.category && (
                        <Badge className="absolute top-4 right-4 bg-[#D7FF3C] text-black border-0 font-mono text-[9px] tracking-[0.2em] uppercase px-3 py-1">
                          {gig.category}
                        </Badge>
                      )}
                      
                      {timeLabel && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-[#9B5CFF] animate-pulse" />
                           <span className="font-mono text-[10px] text-white/80 uppercase tracking-widest">{timeLabel}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-8 flex-1 flex flex-col relative bg-gradient-to-b from-transparent to-black/20">
                      <div className="mb-4 flex items-center justify-between">
                         <span className="font-mono text-[10px] text-[#9B5CFF] uppercase tracking-[0.3em] font-semibold">{gig.sourceName || 'TCR INTELLIGENCE'}</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-6 line-clamp-2 leading-tight group-hover:text-[#D1FF3D] transition-colors duration-300">
                        {gig.title}
                      </h3>

                      <div className="space-y-4 text-sm text-gray-400 mb-8 mt-auto">
                        <div className="flex items-start gap-4">
                          <MapPin className="w-5 h-5 flex-shrink-0 text-[#9B5CFF]" />
                          <div>
                            <p className="text-gray-200 font-bold tracking-tight text-base">{gig.venue}</p>
                            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">{gig.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Calendar className="w-5 h-5 text-[#D7FF3C]" />
                          <span className="font-mono text-xs text-gray-300 tracking-wider uppercase">{formatted}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-transparent border border-white/10 text-white hover:bg-[#D1FF3D] hover:text-black hover:border-[#D1FF3D] transition-all duration-500 font-mono text-[11px] tracking-[0.3em] uppercase h-14 group/btn"
                        asChild
                      >
                        <a
                          href={gig.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-3"
                        >
                          Source Intelligence
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-6 bg-[#111] border border-[#222] rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">About India Gigs</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Events are curated from trusted sources including Rolling Stone India, Festival Sherpa, and 
            other leading music publications. Check back regularly for new additions and updates.
          </p>
        </div>
      </main>
    </div>
  );
}
