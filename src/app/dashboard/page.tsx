
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
  Clock,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';
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
    <div className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-[#0a0a0a]">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6" />
          <span className="text-white">thecueRoom</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <h3 className="px-3 pb-3 text-[10px] font-medium uppercase tracking-wider text-[#666666]">
          Navigation
        </h3>
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors',
                  isActive 
                    ? 'bg-[#c8ff00] text-black' 
                    : 'text-white hover:bg-[#1a1a1a]'
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors',
            pathname === '/settings' 
              ? 'bg-[#c8ff00] text-black' 
              : 'text-white hover:bg-[#1a1a1a]'
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
      </div>

      <div className="border-t border-[#1a1a1a] px-4 py-3 text-[11px] text-[#666666]">
        © thecueRoom Underground Collective
      </div>
    </div>
  );
}

function Header() {
  const { user } = useUser();

  return (
    <header className="h-16 px-6 flex items-center justify-between bg-[#0a0a0a] border-b border-[#1a1a1a]">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <input
            type="text"
            placeholder="Search artists, gigs, news..."
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg text-[13px] text-white placeholder:text-[#666666] focus:outline-none focus:border-[#333333]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback className="text-xs font-bold bg-[#c8ff00] text-black">
            {user?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-4">
      {/* Verification Banner */}
      <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Verification Pending</h2>
              <p className="text-[13px] text-[#999999]">Your account is under review. You'll be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="h-9 px-4 text-[13px] font-medium border-[#333333] text-white bg-transparent hover:bg-[#1a1a1a]"
              >
                Sign Out
              </Button>
              <Button 
                className="h-9 px-4 text-[13px] font-semibold bg-[#c8ff00] text-black hover:bg-[#d7ff3c]"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spotlight */}
        <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Spotlight</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Music className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#c8ff00]" />
                <div>
                  <div className="text-[13px] font-semibold text-white">🎵 Trending Artist</div>
                  <div className="text-[11px] mt-1 text-[#666666]">Fresh new spotlight from the underground.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gig Radar */}
        <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Gig Radar</h2>
            <div className="space-y-2">
              <div className="p-3 rounded-md bg-[#1a1a1a]">
                <div className="flex items-start justify-between">
                  <div className="text-[13px] font-semibold text-white">Bangalore Warehouse 03</div>
                  <div className="text-[11px] text-[#999999] whitespace-nowrap ml-2">Fri • 11:30 PM</div>
                </div>
              </div>
              <div className="p-3 rounded-md bg-[#1a1a1a]">
                <div className="flex items-start justify-between">
                  <div className="text-[13px] font-semibold text-white">Basement House 12</div>
                  <div className="text-[11px] text-[#999999] whitespace-nowrap ml-2">Sat • 10:00 PM</div>
                </div>
              </div>
              <div className="p-3 rounded-md bg-[#1a1a1a]">
                <div className="flex items-start justify-between">
                  <div className="text-[13px] font-semibold text-white">Secret Rooftop</div>
                  <div className="text-[11px] text-[#999999] whitespace-nowrap ml-2">Sun • 7:00 PM</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Verification Status</h2>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-[#999999]" />
              <span className="text-[13px] text-[#999999]">Pending review</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gig Radar (Right Column) */}
        <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
          <CardContent className="p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Gig Radar</h2>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-white">Industrial Night</div>
                  <div className="text-[11px] mt-0.5 text-[#666666]">Today</div>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-white">Deep House Pop-up</div>
                  <div className="text-[11px] mt-0.5 text-[#666666]">Tomorrow</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#0f0f0f] border-[#1a1a1a] lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-white">Recent Activity</h2>
              <div className="text-[11px] flex items-center gap-1.5 text-[#666666]">
                <div className="animate-spin w-3 h-3 border-2 border-[#666666] border-t-transparent rounded-full"></div>
                Loading
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-[#1a1a1a]">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-[11px] font-bold bg-[#2a2a2a] text-[#c8ff00]">
                    AM
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white">Ava Martinez</div>
                  <div className="text-[11px] mt-0.5 text-[#666666]">Queued update while verification completes</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-[#1a1a1a]">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="text-[11px] font-bold bg-[#2a2a2a] text-[#c8ff00]">
                    SY
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white">System</div>
                  <div className="text-[11px] mt-0.5 text-[#666666]">Invite-only access enforced</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Curators */}
      <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
        <CardContent className="p-5">
          <h2 className="text-[15px] font-semibold text-white mb-4">Curators</h2>
          <div className="flex gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#2a2a2a] text-[#c8ff00]">C1</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#2a2a2a] text-[#c8ff00]">C2</AvatarFallback>
            </Avatar>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs font-bold bg-[#2a2a2a] text-[#c8ff00]">C3</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>

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
    <div className="bg-[#000000] min-h-screen">
      <AuthRedirector />
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          {isDashboardHome ? <DashboardContent /> : children}
        </main>
      </div>
    </div>
  );
}
