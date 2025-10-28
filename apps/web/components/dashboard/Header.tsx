
'use client';

import { Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/Logo';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ user, onSidebarToggle, sidebarOpen }: HeaderProps) {
  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-[#0b0b0b] border-b border-[#1a1a1a] z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="text-white text-[15px] font-semibold">thecueRoom</span>
          </div>
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] transition-all duration-200 group"
            aria-label="Toggle sidebar"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-[18px] h-[18px] text-gray-400 group-hover:text-[var(--tcr-accent)] transition-colors" strokeWidth={2} />
            ) : (
              <PanelLeft className="w-[18px] h-[18px] text-gray-400 group-hover:text-[var(--tcr-accent)] transition-colors" strokeWidth={2} />
            )}
          </button>
        </div>

        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="search"
              placeholder="Search artists, gigs, news..."
              className="w-full h-10 pl-10 pr-4 bg-transparent border border-[#1a1a1a] rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#2a2a2a] transition-colors"
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
