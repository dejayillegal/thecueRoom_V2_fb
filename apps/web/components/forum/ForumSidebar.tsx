'use client';

import { Crown, Calendar, Music, MapPin, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Contributor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  verified: boolean;
  posts: number;
  likes: number;
  genre?: string;
  region?: string;
}

const topContributors: Contributor[] = [
  {
    id: '1',
    username: 'jazzfusion_pro',
    displayName: 'Marcus J.',
    verified: true,
    posts: 247,
    likes: 1832,
    genre: 'Jazz',
    region: 'NYC',
  },
  {
    id: '2',
    username: 'synth_master',
    displayName: 'Sarah K.',
    verified: true,
    posts: 189,
    likes: 1456,
    genre: 'Electronic',
    region: 'Berlin',
  },
  {
    id: '3',
    username: 'guitar_wizard',
    displayName: 'Tom R.',
    verified: false,
    posts: 156,
    likes: 943,
    genre: 'Rock',
    region: 'LA',
  },
];

const upcomingGigs = [
  {
    id: '1',
    title: 'Synth Night @ The Echo',
    artist: 'Various Artists',
    date: 'Nov 8, 2024',
    location: 'Los Angeles, CA',
  },
  {
    id: '2',
    title: 'Jazz Fusion Live',
    artist: 'Marcus J. Quartet',
    date: 'Nov 12, 2024',
    location: 'New York, NY',
  },
];

export function ForumSidebar() {
  return (
    <div className="sticky top-6 space-y-6">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-[#D7FF3C]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Top Contributors
          </h3>
        </div>

        <div className="space-y-3">
          {topContributors.map((contributor, index) => (
            <Link
              key={contributor.id}
              href={`/profile/${contributor.username}`}
              className="block hover:bg-[#111111] rounded-lg p-2 transition-colors -mx-2"
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-sm font-bold">
                    {contributor.displayName[0]}
                  </div>
                  {contributor.verified && (
                    <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 text-green-500 bg-[#0a0a0a] rounded-full" />
                  )}
                  {index === 0 && (
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#D7FF3C] text-black rounded-full flex items-center justify-center text-[10px] font-bold">
                      1
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {contributor.displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1.5">
                    {contributor.genre && (
                      <span className="flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {contributor.genre}
                      </span>
                    )}
                    {contributor.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {contributor.region}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">
                      <span className="text-[#D7FF3C] font-semibold">{contributor.posts}</span> posts
                    </span>
                    <span className="text-gray-400">
                      <span className="text-[#9B5CFF] font-semibold">{contributor.likes}</span> likes
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/forum/contributors"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-[#D7FF3C] hover:text-[#e7ff6f] transition-colors"
        >
          View All Contributors
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
          Community Rules
        </h3>
        <ul className="space-y-2 text-xs text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-[#D7FF3C] mt-0.5">•</span>
            <span>Be respectful and constructive</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D7FF3C] mt-0.5">•</span>
            <span>No spam or self-promotion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D7FF3C] mt-0.5">•</span>
            <span>Stay on topic (music/gear only)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D7FF3C] mt-0.5">•</span>
            <span>No hate speech or harassment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#D7FF3C] mt-0.5">•</span>
            <span>Verify before sharing deals/info</span>
          </li>
        </ul>
        <Link
          href="/forum/rules"
          className="mt-3 inline-flex items-center gap-1 text-xs text-[#D7FF3C] hover:text-[#e7ff6f] transition-colors"
        >
          Full Guidelines
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[#9B5CFF]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Upcoming Gigs
          </h3>
        </div>

        <div className="space-y-3">
          {upcomingGigs.map((gig) => (
            <div key={gig.id} className="pb-3 border-b border-[#1a1a1a] last:border-0 last:pb-0">
              <h4 className="text-sm font-semibold text-white mb-1">{gig.title}</h4>
              <p className="text-xs text-gray-400 mb-1">{gig.artist}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#D7FF3C]">{gig.date}</span>
                <span className="text-gray-500">{gig.location}</span>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/events"
          className="mt-4 flex items-center justify-center gap-1 text-xs text-[#D7FF3C] hover:text-[#e7ff6f] transition-colors"
        >
          View All Events
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TopContributor {
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  karmaPoints: number;
  badges: string[];
}

export function ForumSidebar() {
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);

  useEffect(() => {
    fetchTopContributors();
  }, []);

  const fetchTopContributors = async () => {
    try {
      const response = await fetch('/api/forum/contributors', { cache: 'no-store' });
      const data = await response.json();
      setTopContributors(data.contributors || []);
    } catch (error) {
      console.error('[Forum] Failed to fetch contributors:', error);
    }
  };

  return (
    <div className="sticky top-6">
      <Card className="bg-[#0a0a0a] border-[#1a1a1a] p-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D7FF3C]" />
          Top Contributors
        </h3>
        <div className="space-y-3">
          {topContributors.slice(0, 5).map((contributor, i) => (
            <div key={contributor.userId} className="flex items-center gap-3 p-2 bg-[#111111] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D7FF3C] to-[#9B5CFF] flex items-center justify-center text-black text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {contributor.displayName || contributor.username}
                </p>
                <p className="text-[10px] text-gray-500">
                  {contributor.karmaPoints} karma
                </p>
              </div>
              {contributor.badges && contributor.badges[0] && (
                <span className="text-sm">{contributor.badges[0]}</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
