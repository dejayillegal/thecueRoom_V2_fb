
// app/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/AuthProvider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Logo from '@/components/logo';

type OnboardingStep = 'profile' | 'genres' | 'links' | 'preferences';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile step
  const [artistName, setArtistName] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<string[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [bio, setBio] = useState('');

  // Genres step
  const [primaryGenres, setPrimaryGenres] = useState<string[]>([]);
  const [tempoMin, setTempoMin] = useState('124');
  const [tempoMax, setTempoMax] = useState('132');
  const [energy, setEnergy] = useState<string[]>([]);
  const [influences, setInfluences] = useState('');

  // Links step
  const [soundcloud, setSoundcloud] = useState('');
  const [bandcamp, setBandcamp] = useState('');
  const [mixcloud, setMixcloud] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');

  // Preferences (handled in separate step)

  const validateInviteCode = async (code: string): Promise<boolean> => {
    try {
      const codeDoc = await getDoc(doc(db, 'inviteCodes', code));
      if (codeDoc.exists() && !codeDoc.data().used) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invite code validation error:', error);
      return false;
    }
  };

  const handleProfileSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    // Validate invite code
    const isValid = await validateInviteCode(inviteCode);
    if (!isValid) {
      alert('Invalid or already used invite code.');
      setIsLoading(false);
      return;
    }

    // Save profile data
    await setDoc(
      doc(db, 'users', user.uid),
      {
        artistName,
        location,
        role,
        bio,
        inviteCode,
        onboardingStep: 'genres',
        createdAt: new Date(),
      },
      { merge: true }
    );

    // Mark invite code as used
    await setDoc(doc(db, 'inviteCodes', inviteCode), { used: true, usedBy: user.uid }, { merge: true });

    setStep('genres');
    setIsLoading(false);
  };

  const handleGenresSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    await setDoc(
      doc(db, 'users', user.uid),
      {
        primaryGenres,
        tempoMin: parseInt(tempoMin),
        tempoMax: parseInt(tempoMax),
        energy,
        influences,
        onboardingStep: 'links',
      },
      { merge: true }
    );

    setStep('links');
    setIsLoading(false);
  };

  const handleLinksSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    await setDoc(
      doc(db, 'users', user.uid),
      {
        links: {
          soundcloud,
          bandcamp,
          mixcloud,
          instagram,
          website,
        },
        onboardingStep: 'preferences',
      },
      { merge: true }
    );

    setStep('preferences');
    setIsLoading(false);
  };

  const handlePreferencesSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    await setDoc(
      doc(db, 'users', user.uid),
      {
        onboardingCompleted: true,
        onboardingStep: 'completed',
      },
      { merge: true }
    );

    router.push('/verify-code');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <Logo className="h-10 w-10" />
          <h1 className="text-2xl font-light">Create your Profile</h1>
        </div>

        <p className="text-neutral-400 mb-6">
          Introduce yourself to curators and the community. Basic info first — you can refine later.
        </p>

        {/* Step indicators */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={step === 'profile' ? 'default' : 'outline'}
            className={step === 'profile' ? 'bg-primary text-black' : ''}
            onClick={() => setStep('profile')}
          >
            1 • Profile
          </Button>
          <Button
            variant={step === 'genres' ? 'default' : 'outline'}
            className={step === 'genres' ? 'bg-primary text-black' : ''}
            onClick={() => setStep('genres')}
            disabled={!artistName}
          >
            2 • Genres
          </Button>
          <Button
            variant={step === 'links' ? 'default' : 'outline'}
            className={step === 'links' ? 'bg-primary text-black' : ''}
            onClick={() => setStep('links')}
            disabled={primaryGenres.length === 0}
          >
            3 • Links
          </Button>
          <Button
            variant={step === 'preferences' ? 'default' : 'outline'}
            className={step === 'preferences' ? 'bg-primary text-black' : ''}
            onClick={() => setStep('preferences')}
            disabled={!soundcloud && !instagram}
          >
            4 • Preferences
          </Button>
        </div>

        {/* Profile Step */}
        {step === 'profile' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artist-name">Artist name</Label>
                <Input
                  id="artist-name"
                  placeholder="Your alias"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-3">
                {['Producer', 'DJ', 'Live Act', 'Label'].map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <Checkbox
                      id={r}
                      checked={role.includes(r)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRole([...role, r]);
                        } else {
                          setRole(role.filter((item) => item !== r));
                        }
                      }}
                    />
                    <label htmlFor={r} className="text-sm">
                      {r}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite code</Label>
              <Input
                id="invite-code"
                type="password"
                placeholder="••••••••••"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-neutral-900 border-neutral-700"
              />
              <p className="text-xs text-neutral-500">Required to access gated rooms.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Short, punchy. 1-2 sentences recommended."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-neutral-900 border-neutral-700 min-h-24"
              />
            </div>

            <Button
              onClick={handleProfileSubmit}
              disabled={isLoading || !artistName || !inviteCode}
              className="w-full bg-primary text-black hover:bg-primary/90"
            >
              Continue to Genres
            </Button>
          </div>
        )}

        {/* Genres Step */}
        {step === 'genres' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Primary genres (choose up to 3)</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Techno', 'House', 'Minimal', 'Deep House', 'Acid', 'Electro', 'Industrial', 'Breaks'].map((genre) => (
                  <Button
                    key={genre}
                    variant={primaryGenres.includes(genre) ? 'default' : 'outline'}
                    className={primaryGenres.includes(genre) ? 'bg-primary text-black' : ''}
                    onClick={() => {
                      if (primaryGenres.includes(genre)) {
                        setPrimaryGenres(primaryGenres.filter((g) => g !== genre));
                      } else if (primaryGenres.length < 3) {
                        setPrimaryGenres([...primaryGenres, genre]);
                      }
                    }}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tempo-min">Tempo range (BPM)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="tempo-min"
                    type="number"
                    value={tempoMin}
                    onChange={(e) => setTempoMin(e.target.value)}
                    className="bg-neutral-900 border-neutral-700"
                  />
                  <span>to</span>
                  <Input
                    id="tempo-max"
                    type="number"
                    value={tempoMax}
                    onChange={(e) => setTempoMax(e.target.value)}
                    className="bg-neutral-900 border-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Energy</Label>
                <div className="flex flex-wrap gap-2">
                  {['Low', 'Medium', 'Peak-time'].map((e) => (
                    <Button
                      key={e}
                      variant={energy.includes(e) ? 'default' : 'outline'}
                      className={energy.includes(e) ? 'bg-primary text-black' : ''}
                      onClick={() => {
                        if (energy.includes(e)) {
                          setEnergy(energy.filter((item) => item !== e));
                        } else {
                          setEnergy([...energy, e]);
                        }
                      }}
                    >
                      {e}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="influences">Influences / tags</Label>
              <Input
                id="influences"
                placeholder="Examples: Berghain, Detroit, Dub, Raw, Hypnotic"
                value={influences}
                onChange={(e) => setInfluences(e.target.value)}
                className="bg-neutral-900 border-neutral-700"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleGenresSubmit} disabled={isLoading || primaryGenres.length === 0} className="flex-1 bg-primary text-black hover:bg-primary/90">
                Save & Continue
              </Button>
              <Button variant="outline" onClick={() => setStep('profile')} className="flex-1">
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Links Step */}
        {step === 'links' && (
          <div className="space-y-6">
            <p className="text-neutral-400">
              Connect platforms your fans and curators use. Keep it minimal and relevant.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="soundcloud">SoundCloud</Label>
                <Input
                  id="soundcloud"
                  placeholder="https://soundcloud.com/yourprofile"
                  value={soundcloud}
                  onChange={(e) => setSoundcloud(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bandcamp">Bandcamp</Label>
                <Input
                  id="bandcamp"
                  placeholder="https://bandcamp.com/yourprofile"
                  value={bandcamp}
                  onChange={(e) => setBandcamp(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mixcloud">Mixcloud</Label>
                <Input
                  id="mixcloud"
                  placeholder="https://mixcloud.com/yourprofile"
                  value={mixcloud}
                  onChange={(e) => setMixcloud(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="https://instagram.com/yourprofile"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://yourdomain.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="bg-neutral-900 border-neutral-700"
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500">
              At least one valid link is sufficient. Others are optional.
            </p>
            <p className="text-xs text-neutral-500">
              • Links are reviewed by curators for authenticity.
            </p>
            <p className="text-xs text-neutral-500">
              • Avoid link farms; 3-5 key links work best.
            </p>

            <div className="flex gap-2">
              <Button onClick={handleLinksSubmit} disabled={isLoading} className="flex-1 bg-primary text-black hover:bg-primary/90">
                Save & Continue
              </Button>
              <Button variant="outline" onClick={() => setStep('genres')} className="flex-1">
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Preferences Step */}
        {step === 'preferences' && (
          <div className="space-y-6">
            <p className="text-neutral-400">Final step! Set your preferences.</p>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="email-notifications" />
                <label htmlFor="email-notifications" className="text-sm">
                  Email notifications for gig updates
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="community-digest" />
                <label htmlFor="community-digest" className="text-sm">
                  Weekly community digest
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="curator-messages" />
                <label htmlFor="curator-messages" className="text-sm">
                  Allow curator direct messages
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePreferencesSubmit} disabled={isLoading} className="flex-1 bg-primary text-black hover:bg-primary/90">
                Complete Setup
              </Button>
              <Button variant="outline" onClick={() => setStep('links')} className="flex-1">
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
