'use client';

import { useParams } from 'next/navigation';
import { PublicProfile } from '@/components/Profile/PublicProfile';
import { useEffect, useState } from 'react';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user?.id) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(err => console.error('Session fetch error:', err));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <div className="grain-overlay" />

      <header className="sticky top-0 z-50 bg-[#0b0b0b]/95 border-b border-[#222] backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] bg-clip-text text-transparent">
              thecueRoom
            </span>
          </a>
        </div>
      </header>

      <main>
        <PublicProfile username={username} currentUserId={currentUserId} />
      </main>
    </div>
  );
}