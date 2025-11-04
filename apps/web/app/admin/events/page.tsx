
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

interface EventSubmission {
  id: string;
  title: string;
  venue: string;
  date: string;
  artist?: string;
  region?: string;
  genre?: string;
  ticketUrl?: string;
  imageUrl?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/verify/queue');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      const res = await fetch(`/api/verify/accept/${eventId}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to approve event:', error);
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      const res = await fetch(`/api/verify/reject/${eventId}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to reject event:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <p className="text-gray-400">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Review Event Submissions</h1>
        <p className="text-gray-400 text-sm">Approve or reject submitted events</p>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card className="bg-[#111111] border-[#1a1a1a] p-12 text-center">
            <p className="text-gray-400">No pending event submissions</p>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="bg-[#111111] border-[#1a1a1a] p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {event.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full lg:w-48 h-32 object-cover rounded"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {event.title}
                      </h3>
                      {event.artist && (
                        <p className="text-gray-400 text-sm mb-2">{event.artist}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        event.status === 'approved'
                          ? 'default'
                          : event.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {event.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={16} />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin size={16} />
                      <span>{event.venue}{event.region ? `, ${event.region}` : ''}</span>
                    </div>
                  </div>

                  {event.genre && (
                    <div className="mb-4">
                      <Badge variant="outline" className="text-xs">
                        {event.genre}
                      </Badge>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(event.id)}
                      disabled={event.status !== 'pending'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(event.id)}
                      disabled={event.status !== 'pending'}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    {event.ticketUrl && (
                      <Button variant="outline" asChild>
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Tickets
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
