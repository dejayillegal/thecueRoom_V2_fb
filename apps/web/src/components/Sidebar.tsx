
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

const NavItem = memo(({ href, icon: Icon, label, isActive }: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-black font-semibold'
        : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
    }`}
  >
    <Icon size={20} />
    <span>{label}</span>
  </Link>
));

NavItem.displayName = 'NavItem';

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0B0B0B] border-r border-[#1a1a1a] p-4">
      <nav className="space-y-2" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
});
