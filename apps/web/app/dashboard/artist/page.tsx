
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, MessageSquare, FileText, Calendar, Plus, Music } from 'lucide-react';
import Link from 'next/link';
import { LatestPlaylistWidget } from '@/components/Dashboard/LatestPlaylistWidget';
import { TrackSuggestionModal } from '@/components/Dashboard/TrackSuggestionModal';

export default function ArtistDashboard() {
  const [stats, setStats] = useState({
    myEvents: 0,
    aiCredits: 100,
    followers: 0,
  });
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Artist Dashboard</h1>
        <p className="text-gray-400 text-sm">Your creative hub</p>
      </div>

      {/* Latest Playlist Widget */}
      <div className="mb-6">
        <LatestPlaylistWidget
          userRole="artist"
          onSuggestTrack={() => setShowSuggestModal(true)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6 hover:border-[var(--tcr-accent)]/30 transition-colors">
          <Link href="/ai/cover-art" className="block">
            <div className="flex items-center gap-3 mb-2">
              <Image className="text-[var(--tcr-accent)]" size={20} />
              <h3 className="text-white font-semibold">AI Cover Art</h3>
            </div>
            <p className="text-gray-400 text-sm">Generate unique album covers</p>
          </Link>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6 hover:border-[var(--tcr-accent)]/30 transition-colors">
          <Link href="/ai/meme-studio" className="block">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="text-purple-400" size={20} />
              <h3 className="text-white font-semibold">AI Meme Studio</h3>
            </div>
            <p className="text-gray-400 text-sm">Create viral memes</p>
          </Link>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6 hover:border-[var(--tcr-accent)]/30 transition-colors">
          <Link href="/ai/epk-generator" className="block">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-blue-400" size={20} />
              <h3 className="text-white font-semibold">AI EPK Generator</h3>
            </div>
            <p className="text-gray-400 text-sm">Professional press kits</p>
          </Link>
        </Card>
      </div>

      <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">My Events</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Submit Event
          </Button>
        </div>
        <p className="text-gray-400 text-sm">You have {stats.myEvents} events</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <h3 className="text-white font-semibold mb-2">AI Credits</h3>
          <p className="text-3xl font-bold text-[var(--tcr-accent)]">{stats.aiCredits}</p>
          <p className="text-gray-400 text-sm mt-2">Available for AI tools</p>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#1a1a1a] p-6">
          <h3 className="text-white font-semibold mb-2">Community</h3>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/community/forum'}>
            Join Forum
          </Button>
        </Card>
      </div>

      {/* Track Suggestion Modal */}
      <TrackSuggestionModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
      />
    </div>
  );
}
