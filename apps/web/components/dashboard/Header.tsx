
'use client';

import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';
import Link from 'next/link';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  sidebarOpen?: boolean;
}

export function Header({ user, sidebarOpen }: HeaderProps) {
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header 
      className="fixed top-0 right-0 h-14 bg-background z-30"
      style={{ left: sidebarOpen ? '200px' : '60px', transition: 'left 0.2s ease' }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="search"
              placeholder="Search artists, gigs, news..."
              className="w-full h-9 pl-10 pr-4 bg-transparent border border-[#1a1a1a] text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#2a2a2a] transition-colors"
            />
          </div>
        </div>

        <Avatar className="w-9 h-9 cursor-pointer ring-2 ring-transparent hover:ring-[#1a1a1a] transition-all">
          <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-[var(--tcr-accent)] text-black text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
