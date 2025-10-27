'use client';

import { useState, useEffect } from 'react';
import AnimatedHero from '@/app/components/AnimatedHero';
import HomeClient, { FeedItem } from './components/HomeClient';
import LandingHeader from './components/LandingHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { SignInModal } from '@/components/auth/SignInModal';
import Link from 'next/link';

export default function LandingPage() {
  const [initialItems, setInitialItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);


  useEffect(() => {
    async function fetchInitialItems() {
      try {
        const res = await fetch('/api/feeds?limit=44');
        if (!res.ok) {
          throw new Error('Failed to fetch feed data');
        }
        const items = await res.json();
        setInitialItems(items);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialItems();
  }, []);

  return (
      <>
      <div className="flex min-h-screen flex-col text-white">
        <div className="grain-overlay"></div>
        
        <LandingHeader onSignInClick={() => setSignInModalOpen(true)} />

        <main className="flex-grow">
          <div className="relative overflow-hidden">
            <div
              className="absolute inset-0 -z-10"
              aria-hidden="true"
            >
              <div className="hero-glow" />
            </div>
            <AnimatedHero />
          </div>
          <div className="px-4 md:px-6 max-w-6xl mx-auto">
            {loading ? (
                <div>
                    <div className="mb-8">
                        <Skeleton className="h-[50vh] md:h-[56vh] w-full" />
                    </div>
                    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                        <div key={i} className="mb-6 break-inside-avoid">
                            <Skeleton className="h-48 w-full mb-4" />
                            <Skeleton className="h-4 w-1/4 mb-2" />
                            <Skeleton className="h-6 w-full mb-2" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        ))}
                    </div>
                </div>
            ) : (
                <HomeClient initialItems={initialItems} />
            )}
          </div>
        </main>

        <footer className="border-t border-neutral-800 px-6 py-12 text-sm text-muted-foreground">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-4">
            <div>© TheCueRoom. Built for serious techno & house artists.</div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">Product</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">Community</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Feed
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Gig Radar
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Playlists
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-foreground">Social</h4>
              <ul className="space-y-1">
                <li>
                  <Link href="#" className="hover:text-secondary">
                    Instagram
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    SoundCloud
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-secondary">
                    YouTube
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
      <SignInModal isOpen={isSignInModalOpen} onOpenChange={setSignInModalOpen} />
      </>
  );
}
