
'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Calendar, Users, Settings, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/music/weekly', icon: Music, label: 'Music' },
  { href: '/gigs/india', icon: Calendar, label: 'Gigs' },
  { href: '/community/forum', icon: Users, label: 'Community' },
  { href: '/ai/cover-art', icon: Sparkles, label: 'AI Studio' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const;

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0f0f0f] border-r border-[#1a1a1a] flex-shrink-0">
      <nav className="p-4 space-y-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--tcr-accent)] text-black font-semibold'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
});
