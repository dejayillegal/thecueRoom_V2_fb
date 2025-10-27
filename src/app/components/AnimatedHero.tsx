'use client';

import { Button } from '@/components/ui/button';
import { Users, Info, Sparkles, Compass, Handshake, Shield } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/logo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const taglines = [
    // signal + ethos
    "Where music meets machine, and the underground stays pure.",
    "Verified artists. Low noise. High signal.",
    "Built for crews, labels, and rooms—not algorithms.",
    // creation
    "AI cover art and on-brand promo in minutes.",
    "Meme lab, EPK & stage plot—export-ready.",
    // discovery
    "Curated scene intel: news, mixes, labels, and gigs.",
    "Gear, plugins, and DAW updates without the hype.",
    // community / safety
    "Reputation that travels—privacy-first verification.",
    // region focus
    "Scene radar for Asia and India—global by design.",
    // value in one line
    "Create, get verified, and get booked.",
    "All signal. No clout-chasing.",
];

const AnimatedHero = () => {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prevIndex) => (prevIndex + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="px-4 md:px-6 py-8 md:py-10 text-left max-w-6xl mx-auto w-full">
      <div className="space-y-3">
        <div className="text-base font-light flex items-center">
          <span className="text-lg md:text-xl">Welcome to the</span>
          <Logo className="inline-block h-5 w-auto align-left" aria-label="thecueRoom"/>
          <span className="text-lg md:text-xl">ueRoom</span>
        </div>
        
        <div className="h-8 md:h-4">
          <AnimatePresence mode="wait">
            <motion.h3
              key={taglineIndex}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 1.5 }}
              className="text-xs md:text-sm italic text-secondary"
            >
              {taglines[taglineIndex]}
            </motion.h3>
          </AnimatePresence>
        </div>
        
        <div className="flex justify-start gap-2 pt-2">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="#">
              Join the Community
              <Users className="size-4" />
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Info className="size-4" />
                Learn More
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-surface/80 backdrop-blur-lg border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-2xl">About thecueRoom</DialogTitle>
            </DialogHeader>

            <div className="py-4 text-muted-foreground space-y-5">
              <p>
                thecueRoom is an invite-only, privacy-respecting studio and community for
                underground electronic music—house, techno, leftfield, and the edges in between.
                We blend pragmatic AI tools with human curation so artists can create, get
                verified, and plug into the right scenes without noise.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Sparkles className="size-4 text-secondary" />
                    Create
                  </h4>
                  <ul className="list-disc pl-8 text-xs space-y-1">
                    <li>AI Cover Art (vibe, genre, short prompt) with on-brand presets.</li>
                    <li>Meme Generator for safe, shareable promo.</li>
                    <li>EPK &amp; Stage Plot builder—export-ready for promoters.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Compass className="size-4 text-secondary" />
                    Discover
                  </h4>
                  <ul className="list-disc pl-8 text-xs space-y-1">
                    <li>
                      Curated feeds: scene/Asia/India plus gear, plugins, and DAW intel.
                    </li>
                    <li>Gig Radar for underground rooms—global by design.</li>
                    <li>Playlists, mixes, and community posts with verified attribution.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Handshake className="size-4 text-secondary" />
                    Collaborate
                  </h4>
                  <ul className="list-disc pl-8 text-xs space-y-1">
                    <li>Invite-only spaces for artists, labels, and promoters.</li>
                    <li>Verification that supports re-checks and needs-info flows.</li>
                    <li>Lightweight admin tools: approvals, flags, and system health.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Shield className="size-4 text-secondary" />
                    Protect
                  </h4>
                  <ul className="list-disc pl-8 text-xs space-y-1">
                    <li>Scam-resistant auth, tiered access, and audit trails.</li>
                    <li>
                      Ethical link-outs: we credit original publishers and never mirror article
                      bodies.
                    </li>
                    <li>Accessibility &amp; performance first (respects reduced motion).</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm pt-2">
                Built by and for underground creators. We ship carefully, avoid hype, and keep
                the lights on with real utility—so you can focus on the music and the rooms that
                matter.
              </p>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default AnimatedHero;
