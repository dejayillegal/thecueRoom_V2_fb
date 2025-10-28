
'use client';

import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-[var(--surface)] z-40 ml-0 lg:ml-[258px]">
      <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="search"
              placeholder="Search artists, gigs, news..."
              className="w-full h-10 pl-10 pr-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--tcr-accent)]/50"
            />
          </div>
        </div>

        <Avatar className="w-9 h-9">
          <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
