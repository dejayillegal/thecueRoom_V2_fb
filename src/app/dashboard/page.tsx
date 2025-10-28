
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  LayoutGrid,
  Newspaper,
  MicVocal,
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

// --- Sidebar Component ---
const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/ai/cover-art', label: 'AI Cover Art', icon: MicVocal },
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
    <div className="w-64 bg-black border-r border-[#1a1a1a] flex flex-col h-screen fixed left-0 top-0">
      <div className="flex h-16 items-center px-4 border-b border-[#1a1a1a]">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          <span className="text-[#c8ff00]">thecueRoom</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="px-3 pb-2 text-xs font-semibold uppercase text-gray-500">Navigation</h3>
        <nav className="space-y-1">
          {mainNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                pathname === item.href 
                  ? 'bg-[#c8ff00] text-black font-semibold' 
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-[#1a1a1a]">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
            pathname === '/settings' 
              ? 'bg-[#c8ff00] text-black font-semibold' 
              : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div className="p-4 border-t border-[#1a1a1a] text-xs text-gray-500">
        © thecueRoom Underground Collective
      </div>
    </div>
  );
}

// --- Header Component ---
function Header() {
  const { user } = useUser();

  return (
    <header className="h-16 border-b border-[#1a1a1a] bg-black px-6 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search artists, gigs, news..."
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#c8ff00]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.photoURL || undefined} />
          <AvatarFallback className="bg-[#c8ff00] text-black text-xs font-bold">
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
      {/* Verification Banner - Full Width */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-purple-700/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Verification Pending</h2>
              <p className="text-sm text-gray-400">Your account is under review. You'll be notified once approved.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-[#1a1a1a]">
                Sign Out
              </Button>
              <Button className="bg-[#c8ff00] text-black hover:bg-[#d4ff33] font-semibold">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Spotlight */}
        <div className="lg:col-span-4">
          <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-4">Spotlight</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Music className="w-5 h-5 text-[#c8ff00] mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white">🎵 Trending Artist</div>
                    <div className="text-xs text-gray-500 mt-1">Fresh new spotlight from the underground.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Gig Radar */}
        <div className="lg:col-span-4">
          <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-4">Gig Radar</h2>
              <div className="space-y-3">
                <div className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="text-sm font-semibold text-white">Bangalore Warehouse 03</div>
                  <div className="text-xs text-gray-500 mt-1">Fri • 11:30 PM</div>
                </div>
                <div className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="text-sm font-semibold text-white">Basement House 12</div>
                  <div className="text-xs text-gray-500 mt-1">Sat • 10:00 PM</div>
                </div>
                <div className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="text-sm font-semibold text-white">Secret Rooftop</div>
                  <div className="text-xs text-gray-500 mt-1">Sun • 7:00 PM</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Verification Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Gig Radar Mini */}
          <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-4">Gig Radar</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Industrial Night</div>
                    <div className="text-xs text-gray-500 mt-0.5">Today</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Deep House Pop-up</div>
                    <div className="text-xs text-gray-500 mt-0.5">Tomorrow</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-4">Verification Status</h2>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Pending review</span>
              </div>
            </CardContent>
          </Card>

          {/* Curators */}
          <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
            <CardContent className="p-5">
              <h2 className="text-base font-bold text-white mb-4">Curators</h2>
              <div className="flex gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#2a2a2a] text-[#c8ff00] text-xs font-bold">C1</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#2a2a2a] text-[#c8ff00] text-xs font-bold">C2</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#2a2a2a] text-[#c8ff00] text-xs font-bold">C3</AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <Card className="bg-[#0f0f0f] border-[#1a1a1a]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Activity</h2>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <div className="animate-spin w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              Loading
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-[#2a2a2a] text-[#c8ff00] text-xs font-bold">AM</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">Ava Martinez</div>
                <div className="text-xs text-gray-500 mt-0.5">Queued update while verification completes</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-[#2a2a2a] text-[#c8ff00] text-xs font-bold">SY</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">System</div>
                <div className="text-xs text-gray-500 mt-0.5">Invite-only access enforced</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-end pb-4">
        <span className="text-xs text-gray-600">Private beta</span>
      </div>
    </div>
  );
}

// --- Main Dashboard Page Component ---
export default function DashboardPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <div className="bg-black min-h-screen">
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
