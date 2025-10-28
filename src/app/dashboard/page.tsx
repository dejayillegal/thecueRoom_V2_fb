
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  LayoutGrid,
  Newspaper,
  Image,
  Sparkles,
  MessageSquare,
  Music,
  Calendar,
  Search,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import AuthRedirector from '@/components/AuthRedirector';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: Image },
  { href: '/meme-generator', label: 'AI Meme', icon: Sparkles },
  { href: '/ai/epk', label: 'AI EPK Generator', icon: Newspaper },
  { href: '/community', label: 'Community Forum', icon: MessageSquare },
  { href: '/music', label: 'Weekly Curated Music', icon: Music },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/gigs', label: 'Gigs', icon: Calendar },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[258px] h-screen fixed left-0 top-0 flex flex-col bg-black">
      <div className="flex h-[72px] items-center px-5">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-full bg-[#c8ff00] flex items-center justify-center">
            <span className="text-black text-sm font-bold">C</span>
          </div>
          <span className="text-white text-[15px] font-semibold">thecueRoom</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="mb-3 px-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#666666]">
            Navigation
          </h3>
        </div>
        <nav className="space-y-1 mt-3">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all',
                  isActive 
                    ? 'bg-[#c8ff00] text-black font-semibold' 
                    : 'text-white hover:bg-[#1a1a1a] font-normal'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-all',
            pathname === '/settings' 
              ? 'bg-[#c8ff00] text-black font-semibold' 
              : 'text-white hover:bg-[#1a1a1a] font-normal'
          )}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={pathname === '/settings' ? 2.5 : 2} />
          Settings
        </Link>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] text-[#666666]">© thecueRoom Underground Collective</p>
      </div>
    </div>
  );
}

function Header() {
  const { user } = useUser();

  return (
    <header className="h-[72px] px-6 flex items-center justify-between bg-black relative">
      <div className="absolute inset-0 dashboard-header-gradient pointer-events-none" />
      
      <div className="flex-1 max-w-xl relative z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Search artists, gigs, news..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a]/60 border-0 rounded-lg text-[13px] text-white placeholder:text-[#666666] focus:outline-none focus:bg-[#1a1a1a]/80 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-6 relative z-10">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback className="text-xs font-bold bg-[#c8ff00] text-black">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function DashboardContent() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      {/* Top Section - Verification Pending and Gig Radar */}
      <div className="grid grid-cols-3 gap-5">
        {/* Verification Pending - spans 2 columns */}
        <div className="col-span-2 bg-[#0f0f0f] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-white mb-1.5">Verification Pending</h2>
              <p className="text-[13px] text-[#999999]">Your account is under review. You'll be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="h-9 px-5 text-[13px] font-medium border-[#333333] text-white bg-transparent hover:bg-[#1a1a1a] hover:text-white hover:border-[#444444]"
              >
                Sign Out
              </Button>
              <Button 
                className="h-9 px-5 text-[13px] font-semibold bg-[#c8ff00] text-black hover:bg-[#d4ff33]"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Gig Radar - Right Column */}
        <div className="bg-[#0f0f0f] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Gig Radar</h2>
          <div className="space-y-3">
            <div>
              <div className="text-[13px] font-medium text-white">Industrial Night</div>
              <div className="text-[11px] mt-1 text-[#666666]">Today</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-white">Deep House Pop-up</div>
              <div className="text-[11px] mt-1 text-[#666666]">Tomorrow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Three Column Grid - Spotlight, Gig Radar, Verification Status */}
      <div className="grid grid-cols-3 gap-5">
        {/* Spotlight */}
        <div className="bg-[#0f0f0f] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Spotlight</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Music className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#c8ff00]" />
              <div>
                <div className="text-[13px] font-semibold text-white">🎵 Trending Artist</div>
                <div className="text-[11px] mt-1 text-[#666666] leading-relaxed">Fresh new spotlight from the underground.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gig Radar (Center) */}
        <div className="bg-[#0f0f0f] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Gig Radar</h2>
          <div className="space-y-2.5">
            <div className="p-3 rounded-md bg-black/40">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Bangalore Warehouse 03</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Fri • 11:30 PM</div>
              </div>
            </div>
            <div className="p-3 rounded-md bg-black/40">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Basement House 12</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Sat • 10:00 PM</div>
              </div>
            </div>
            <div className="p-3 rounded-md bg-black/40">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13px] font-medium text-white">Secret Rooftop</div>
                <div className="text-[11px] text-[#999999] whitespace-nowrap">Sun • 7:00 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-[#0f0f0f] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Verification Status</h2>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#c8ff00]"></div>
            <span className="text-[13px] text-[#999999]">Pending review</span>
          </div>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <div className="bg-[#0f0f0f] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Recent Activity</h2>
          <div className="text-[11px] flex items-center gap-2 text-[#666666]">
            <div className="w-3 h-3 border-2 border-[#666666] border-t-transparent rounded-full animate-spin"></div>
            Loading
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 rounded-md bg-black/40">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#c8ff00]">
                AM
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white">Ava Martinez</div>
              <div className="text-[11px] mt-1 text-[#666666]">Queued update while verification completes</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-md bg-black/40">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#c8ff00]">
                SY
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-white">System</div>
              <div className="text-[11px] mt-1 text-[#666666]">Invite-only access enforced</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Empty left, Curators right */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2"></div>
        {/* Curators */}
        <div className="bg-[#0f0f0f] rounded-lg p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Curators</h2>
          <div className="flex gap-2.5">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#c8ff00]">C1</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#c8ff00]">C2</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#1a1a1a] text-[#c8ff00]">C3</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Private Beta Footer */}
      <div className="flex justify-end pb-4">
        <span className="text-[11px] text-[#666666]">Private beta</span>
      </div>
    </div>
  );
}

export default function DashboardPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <div className="bg-black min-h-screen">
      <AuthRedirector />
      <Sidebar />
      <div className="ml-[258px] flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {isDashboardHome ? <DashboardContent /> : children}
        </main>
      </div>
    </div>
  );
}
