'use client';

import { useAuth } from '@/lib/firebase/AuthProvider';
import Link from 'next/link';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

interface LandingHeaderProps {
  onSignInClick: () => void;
}

export default function LandingHeader({ onSignInClick }: LandingHeaderProps) {
  const { user, signOut, isLoading } = useAuth();
  const router = useRouter();


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-900 bg-black/80 backdrop-blur-md px-6 py-4">
      <div className="group">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <Logo className="h-9 w-9" />
          <span className="text-2xl font-bold tracking-tight text-white">thecueRoom</span>
        </Link>
      </div>
      <div className="flex items-center gap-6">
        {isLoading ? (
          <div className="h-10 w-24 rounded-full bg-neutral-800 animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full ring-1 ring-neutral-800 transition-all hover:ring-neutral-700">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || `https://i.pravatar.cc/40?u=${user.uid}`} />
                  <AvatarFallback className="bg-neutral-800 text-white">{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800 text-white">
              <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white" onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white" onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="focus:bg-neutral-800 focus:text-white" onClick={handleSignOut}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={onSignInClick}
              className="text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              Sign In
            </button>
            <Button 
              onClick={onSignInClick}
              className="rounded-full bg-white px-6 text-sm font-bold text-black transition-transform hover:scale-105 hover:bg-neutral-200 active:scale-95"
            >
              Join the Room
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
