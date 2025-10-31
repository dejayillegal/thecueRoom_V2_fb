
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, X, UserPlus, Link as LinkIcon } from 'lucide-react';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (userId: string, jobId: string) => void;
}

export function SignupModal({ open, onOpenChange, onSuccess }: SignupModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [publicProfile, setPublicProfile] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canCloseByBackdrop, setCanCloseByBackdrop] = useState(false);

  // Allow backdrop closing after modal is fully opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setCanCloseByBackdrop(true), 300);
      return () => {
        clearTimeout(timer);
        setCanCloseByBackdrop(false);
      };
    } else {
      setCanCloseByBackdrop(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!agreeTerms) {
      setError('You must agree to the Terms and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      // Register user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          artistName,
          email,
          password,
          region,
          genre,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.message || 'Registration failed');
      }

      const { userId } = await registerRes.json();

      // Submit verification
      const verifyRes = await fetch('/api/verify/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          profileUrl: publicProfile,
        }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || 'Verification submission failed');
      }

      const { jobId } = await verifyRes.json();
      onSuccess(userId, jobId);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const handleBackdropClick = () => {
    if (canCloseByBackdrop) {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={handleBackdropClick} />
      
      <div className="relative w-full max-w-[920px] my-auto bg-[#0F0F0F] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close signup modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[1fr_320px]">
          <div className="p-6 md:p-8 lg:p-10 max-h-[calc(90vh-4rem)] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Create your account</h2>
              <p className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Invite-only: access currently open to curated artists.
                </span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm text-foreground mb-2 block">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm text-foreground mb-2 block">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="artistName" className="text-sm text-foreground mb-2 block">
                  Artist / Project name
                </Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm text-foreground mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-foreground mb-2 block">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                  required
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region" className="text-sm text-foreground mb-2 block">
                    Region <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="region"
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="e.g., North America, Europe, Asia"
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="genre" className="text-sm text-foreground mb-2 block">
                    Primary genre <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="genre"
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="e.g., Techno, House, Minimal"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="publicProfile" className="text-sm text-foreground mb-2 block">
                  <span className="inline-flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Public profile URL
                  </span>
                </Label>
                <Input
                  id="publicProfile"
                  type="url"
                  value={publicProfile}
                  onChange={(e) => setPublicProfile(e.target.value)}
                  className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                  placeholder="https://soundcloud.com/artist"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste any social/profile URL (Instagram, SoundCloud, Spotify, Bandcamp, Beatport, Mixcloud, etc.)
                </p>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1"
                />
                <Label htmlFor="agreeTerms" className="text-xs text-muted-foreground cursor-pointer">
                  I agree to Terms and Privacy
                </Label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Register
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1 border-[#262626] hover:bg-accent"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Our AI will verify your artist profile post-registration to keep the community high-signal and curated.
              </p>
            </form>
          </div>

          <div className="bg-[#0B0B0B] border-t md:border-t-0 md:border-l border-[#262626] p-6 md:p-8">
            <h3 className="text-base font-semibold mb-3">Why join TheCueRoom</h3>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Curated News Rail: underground techno/house by genre + region.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Gigs, cover art marketplace, and invite-only drops.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Private, invite-first community. No noise.</span>
              </li>
            </ul>

            <div className="border-t border-[#262626] pt-4">
              <h4 className="text-sm font-semibold mb-2">Trusted curators</h4>
              <ul className="space-y-2">
                <li className="text-xs text-muted-foreground">• MIXROOM</li>
                <li className="text-xs text-muted-foreground">• Deep Cut</li>
                <li className="text-xs text-muted-foreground">• Void FM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
