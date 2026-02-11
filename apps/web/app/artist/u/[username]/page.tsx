'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import PublicProfile from '@/components/Profile/PublicProfile';

export default function ArtistProfilePage(props: {
  params: Promise<{ username: string }>;
}) {
  const router = useRouter();
  const { username } = use(props.params);
  
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm opacity-70 hover:opacity-100 transition flex items-center gap-2"
        >
          ← Back
        </button>
        <PublicProfile username={username} />
      </div>
    </div>
  );
}
