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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-800 bg-background/95 px-4 md:px-6 py-2">
      <div className="group">
        <Link href="/" className="flex items-center gap-2 text-xl">
          <Logo className="h-8 w-8 md:h-10 md:w-10" />
          <span className="font-light hidden sm:inline">thecueRoom</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isLoading ? (
          <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || `https://i.pravatar.cc/40?u=${user.uid}`} />
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Button variant="outline" onClick={onSignInClick}>
              <Users className="size-4" />
              Login / Sign Up
            </Button>
        )}
      </div>
    </header>
  );
}
