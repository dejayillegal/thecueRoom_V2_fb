
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, ExternalLink, Search, Filter } from 'lucide-react';

interface NormalizedEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  venue?: string;
  city?: string;
  url?: string;
  ticketUrl?: string;
  source: string;
  imageUrl?: string;
}

export default function IndiaGigsPage() {
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [debugMode, setDebugMode] = useState(false);
  const [rawPayload, setRawPayload] = useState<any>(null);

  useEffect(() => {
    const debug = localStorage.getItem('TCR_DEBUG_SHOW_RAW_GIGS') === '1';
    setDebugMode(debug);
    fetchGigs();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [searchQuery, selectedCity, events]);

  const fetchGigs = async () => {
    try {
      const response = await fetch('/api/gigs/india');
      const data = await response.json();
      
      if (debugMode) {
        setRawPayload(data);
      }

      // Handle canonical shape
      if (data.ok && Array.isArray(data.events)) {
        setEvents(data.events);
        setFilteredEvents(data.events);
      } else {
        console.warn('Unexpected API response shape:', data);
        setEvents([]);
        setFilteredEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch gigs:', error);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = [...events];

    // City filter - "all" means no filtering
    if (selectedCity !== 'all') {
      filtered = filtered.filter((gig) => 
        gig.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (gig) =>
          gig.title.toLowerCase().includes(query) ||
          gig.venue?.toLowerCase().includes(query) ||
          gig.city?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const cities = ['all', ...Array.from(new Set(events.map(e => e.city).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">India Gigs</h1>
          <p className="text-gray-400 text-sm">Upcoming electronic music events across India</p>
        </div>

        {debugMode && rawPayload && (
          <details className="mb-4 p-4 bg-gray-900 rounded border border-gray-700">
            <summary className="text-yellow-400 cursor-pointer mb-2">Debug: Raw API Payload</summary>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </details>
        )}

        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111111] border-[#1a1a1a] text-white"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#1a1a1a] text-white rounded-md"
              >
                {cities.map(city => (
                  <option key={city} value={city}>
                    {city === 'all' ? 'All Cities' : city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500 col-span-3">Loading gigs...</p>
          ) : filteredEvents.length === 0 && events.length > 0 ? (
            <div className="col-span-3">
              <p className="text-gray-500 mb-2">No events match your filters</p>
              <Button onClick={() => { setSearchQuery(''); setSelectedCity('all'); }} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-3">
              <p className="text-gray-500 mb-2">No upcoming gigs found</p>
              {debugMode && (
                <Button onClick={() => fetchGigs()} variant="outline" className="mt-2">
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            filteredEvents.map((gig) => (
              <Card key={gig.id} className="bg-[#111111] border-[#1a1a1a] overflow-hidden hover:border-gray-700 transition-colors">
                {gig.imageUrl && (
                  <div className="aspect-video bg-[#0a0a0a]">
                    <img 
                      src={gig.imageUrl} 
                      alt={gig.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/fallbacks/fallback_1.png';
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2 line-clamp-2">{gig.title}</h3>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    {gig.venue && gig.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{gig.venue}, {gig.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{new Date(gig.start).toLocaleDateString('en-IN', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      via {gig.source}
                    </div>
                  </div>
                  {(gig.ticketUrl || gig.url) && (
                    <Button
                      asChild
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <a href={gig.ticketUrl || gig.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Event
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="mt-12 p-6 bg-[#111] border border-[#222] rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">About India Gigs</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Events are curated from trusted sources including Rolling Stone India, BookMyShow, Zomato Live, and 
            other leading music publications. Check back regularly for new additions and updates.
          </p>
          {debugMode && (
            <Button 
              onClick={() => {
                localStorage.removeItem('TCR_DEBUG_SHOW_RAW_GIGS');
                setDebugMode(false);
                window.location.reload();
              }}
              variant="outline"
              className="mt-4"
            >
              Disable Debug Mode
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
