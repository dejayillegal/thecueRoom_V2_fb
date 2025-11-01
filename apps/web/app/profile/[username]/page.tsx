'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, Music, MapPin, Mail, Phone, Globe, CheckCircle2, 
  MessageCircle, ExternalLink, Loader2 
} from 'lucide-react';
import Link from 'next/link';

interface PublicProfile {
  username: string;
  displayName?: string;
  artistName?: string;
  bio?: string;
  avatar?: string;
  region?: string;
  genre?: string;
  verified: boolean;
  email?: string;
  phone?: string;
  socialProfileUrl?: string;
  allowContactRequests: boolean;
  publicReleases: boolean;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicProfile();
  }, [username]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/public/${username}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile');
        }
        return;
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-gray-600" />
        <h1 className="text-2xl font-bold text-white">{error || 'Profile not found'}</h1>
        <Link href="/">
          <Button className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b]">
      <div className="grain-overlay" />
      
      <header className="sticky top-0 z-50 bg-[#0b0b0b]/95 border-b border-[#222] backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-bold bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] bg-clip-text text-transparent">
              thecueRoom
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <Card className="bg-[#111] border-[#222] overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[#9B5CFF]/20 to-[#D7FF3C]/20" />
            
            <div className="px-8 pb-8">
              <div className="flex items-start gap-6 -mt-16 mb-6">
                <div className="relative">
                  {profile.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.displayName || profile.username}
                      className="w-32 h-32 rounded-full border-4 border-[#111] object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-[#111] bg-[#1a1a1a] flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  {profile.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-[#D7FF3C] rounded-full p-1.5">
                      <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                  )}
                </div>

                <div className="flex-1 mt-16">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">
                        {profile.displayName || profile.username}
                      </h1>
                      {profile.artistName && (
                        <p className="text-lg text-[#D7FF3C] mb-2">
                          {profile.artistName}
                        </p>
                      )}
                      <p className="text-gray-400">@{profile.username}</p>
                    </div>

                    {profile.allowContactRequests && (
                      <Button className="bg-[#9B5CFF] text-white hover:bg-[#9B5CFF]/90">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-gray-300 mt-6 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 mt-6">
                    {profile.genre && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Music className="w-4 h-4 text-[#D7FF3C]" />
                        <span>{profile.genre}</span>
                      </div>
                    )}
                    {profile.region && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="w-4 h-4 text-[#D7FF3C]" />
                        <span>{profile.region}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    {profile.email && (
                      <a 
                        href={`mailto:${profile.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-sm text-gray-300 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {profile.email}
                      </a>
                    )}
                    {profile.phone && (
                      <a 
                        href={`tel:${profile.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-sm text-gray-300 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {profile.phone}
                      </a>
                    )}
                    {profile.socialProfileUrl && (
                      <a 
                        href={profile.socialProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-lg text-sm text-gray-300 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Social Profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {profile.verified && (
                    <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">Verified Artist</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {profile.publicReleases && (
            <Card className="bg-[#111] border-[#222] p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-[#D7FF3C]" />
                Releases
              </h2>
              <p className="text-gray-400 text-center py-8">
                No releases yet
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
