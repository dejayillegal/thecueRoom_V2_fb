'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Radar, 
  Sparkles, 
  Calendar,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/gigs', label: 'Gig Radar', icon: Radar },
    { href: '/dashboard/spotlight', label: 'Spotlight', icon: Sparkles },
    { href: '/dashboard/events', label: 'Events', icon: Calendar },
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
        <div className="p-6 border-b border-[#1a1a1a]">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Logo className="w-32 h-8" />
            <span className="font-semibold text-[15px]">thecueRoom</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 px-3 mb-2">Navigation</p>
          </div>

          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all',
                      isActive 
                        ? 'bg-[var(--tcr-accent)] text-black font-semibold' 
                        : 'text-gray-300 hover:bg-[#1a1a1a]'
                    )}
                  >
                    <Icon size={16} />
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-300 hover:bg-[#1a1a1a] transition-all mb-3"
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
          <p className="text-[11px] text-gray-600 px-3">© 2025 thecueRoom</p>
        </div>
      </aside>
    </>
  );
}