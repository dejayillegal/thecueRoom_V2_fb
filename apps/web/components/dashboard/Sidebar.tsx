'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Image,
  MessageSquare,
  FileText,
  Users,
  Music,
  Newspaper,
  Radar,
  Calendar,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/ai/cover-art', label: 'AI Cover Art', icon: Image },
    { href: '/meme-generator', label: 'AI Meme', icon: MessageSquare },
    { href: '/ai/epk', label: 'AI EPK Generator', icon: FileText },
    { href: '/community', label: 'Community Forum', icon: Users },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/gigs', label: 'Gig Radar', icon: Radar },
    { href: '/music', label: 'Weekly Curated Music', icon: Music },
  ];

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#0b0b0b] border border-[#1a1a1a] rounded-md"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      <aside
        data-collapsed={collapsed}
        className={cn(
          'fixed left-0 top-0 h-screen w-[258px] bg-[rgb(11,11,11)] border-r border-[#1a1a1a] flex flex-col transition-transform duration-300',
          collapsed && 'max-lg:-translate-x-full',
          className
        )}
      >
        <div className="h-[72px] flex items-center px-5 border-b border-[#1a1a1a]">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">Navigation</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all',
                      isActive 
                        ? 'bg-[var(--tcr-accent)] text-black font-semibold' 
                        : 'text-white hover:bg-[#1a1a1a]'
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white hover:bg-[#1a1a1a] transition-all mb-3"
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <p className="text-[11px] text-gray-600 px-3">© thecueRoom Underground Collective</p>
        </div>
      </aside>
    </>
  );
}