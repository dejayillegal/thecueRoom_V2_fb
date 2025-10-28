
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  ticketUrl?: string;
  freeTicket: boolean;
  imageUrl?: string;
}

export default function IndiaGigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      const response = await fetch('/api/gigs/india');
      const data = await response.json();
      setGigs(data.gigs || []);
    } catch (error) {
      console.error('Failed to fetch gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">India Gigs</h1>
          <p className="text-gray-400 text-sm">Upcoming electronic music events across India</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500 col-span-3">Loading gigs...</p>
          ) : gigs.length === 0 ? (
            <p className="text-gray-500 col-span-3">No upcoming gigs found</p>
          ) : (
            gigs.map((gig) => (
              <Card key={gig.id} className="bg-[#111111] border-[#1a1a1a] overflow-hidden">
                {gig.imageUrl && (
                  <div className="aspect-video bg-[#0a0a0a]">
                    <img src={gig.imageUrl} alt={gig.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2">{gig.title}</h3>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{gig.venue}, {gig.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(gig.date).toLocaleDateString('en-IN', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  <Button
                    className={`w-full ${
                      gig.freeTicket
                        ? 'bg-[#D1FF3D] text-black hover:bg-[#e7ff6f]'
                        : 'bg-[#873BBF] text-white hover:bg-[#9d4dd4]'
                    }`}
                    asChild={!!gig.ticketUrl}
                  >
                    {gig.ticketUrl ? (
                      <a href={gig.ticketUrl} target="_blank" rel="noopener noreferrer">
                        {gig.freeTicket ? 'Get Free Ticket' : 'Buy Tickets'}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    ) : (
                      <span>{gig.freeTicket ? 'Free Entry' : 'Info Coming Soon'}</span>
                    )}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
