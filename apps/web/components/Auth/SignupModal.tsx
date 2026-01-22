'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { VerificationModal } from '../Auth/VerificationModal';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    special: boolean;
  };
}

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
  const shouldReduceMotion = useReducedMotion();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);

  // Auto-generated username
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');

  // Availability checks
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });
  const [artistNameStatus, setArtistNameStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verification modal
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pass: string): PasswordStrength => {
    const requirements = {
      length: pass.length >= 10,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      special: /[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(pass),
    };

    const metCount = Object.values(requirements).filter(Boolean).length;
    
    let label = 'Weak';
    let color = 'text-red-400';
    if (metCount === 4) {
      label = 'Strong';
      color = 'text-lime-400';
    } else if (metCount >= 2) {
      label = 'Fair';
      color = 'text-yellow-400';
    }

    return { score: metCount, label, color, requirements };
  };

  const strength = getPasswordStrength(password);

  // Debounced availability check
  useEffect(() => {
    if (!email) {
      setEmailStatus({ checking: false, available: null });
      return;
    }

    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: email }),
        });
        const data = await res.json();
        setEmailStatus({
          checking: false,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setEmailStatus({ checking: false, available: null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!artistName) {
      setArtistNameStatus({ checking: false, available: null });
      return;
    }

    const timer = setTimeout(async () => {
      setArtistNameStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'artist', value: artistName }),
        });
        const data = await res.json();
        setArtistNameStatus({
          checking: false,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setArtistNameStatus({ checking: false, available: null });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [artistName]);

  // Generate usernames when artist name changes
  const generateUsernames = useCallback(async () => {
    if (!artistName) return;

    const suffixes = ['sub', 'grid', 'void', 'flux', 'prime', 'edge', 'freq', 'rave', 'drift'];
    const normalized = artistName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '.');

    const suggestions: string[] = [];
    for (let i = 0; i < 3; i++) {
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const random = Math.random().toString(36).substring(2, 5);
      suggestions.push(`${normalized}.${suffix}${random}`);
    }

    setGeneratedUsernames(suggestions);
    setSelectedUsername(suggestions[0]);
  }, [artistName]);

  useEffect(() => {
    if (artistName && artistNameStatus.available) {
      generateUsernames();
    }
  }, [artistName, artistNameStatus.available, generateUsernames]);

  const addSocialLink = () => {
    if (socialLinks.length < 5) {
      setSocialLinks([...socialLinks, '']);
    }
  };

  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = value;
    setSocialLinks(newLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!firstName || !lastName || !artistName || !email || !password || !confirmPassword || !region || !genre) {
      setError('All fields marked with * are required');
      return false;
    }

    if (strength.score < 4) {
      setError('Password does not meet security requirements');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (emailStatus.available === false) {
      setError('Email is already registered');
      return false;
    }

    if (artistNameStatus.available === false) {
      setError('Artist name is already taken');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const validSocialLinks = socialLinks.filter(link => link.trim() !== '');

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          artistName,
          email,
          password,
          confirmPassword,
          username: selectedUsername,
          region,
          genre,
          isArtist: true,
          artistProfile: {
            profileUrl: validSocialLinks[0] || '',
            genre,
            socialLinks: validSocialLinks,
          }
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Signup failed');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      // Brief delay for success animation
      setTimeout(() => {
        setVerificationJobId(data.jobId);
        setShowVerification(true);
        onOpenChange(false);
      }, 600);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
    if (status.checking) {
      return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
    if (status.available === true) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (status.available === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const motionVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -10 },
  };

  const shakeVariants = {
    shake: {
      x: shouldReduceMotion ? 0 : [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.4 }
    }
  };

  const successVariants = {
    initial: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.9 },
    animate: { opacity: 1, scale: 1 },
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-lime-400/20 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-white tracking-tight">Create your account</DialogTitle>
            <p className="text-sm italic" style={{ color: '#9B5CFF' }}>Join thecueRoom community</p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                variants={successVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <div className="w-20 h-20 bg-lime-400/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-lime-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Account Created!</h3>
                <p className="text-gray-400">Redirecting to verification...</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-lime-400 font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="Jane"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-lime-400 font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artistName" className="text-lime-400 font-medium">Artist Name *</Label>
                  <div className="relative">
                    <Input
                      id="artistName"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white pr-10"
                      placeholder="Your DJ/Artist Name"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AvailabilityIndicator status={artistNameStatus} />
                    </div>
                  </div>
                  {artistNameStatus.reason && (
                    <p className="text-xs text-red-400 font-medium">{artistNameStatus.reason}</p>
                  )}
                </div>

                <AnimatePresence>
                  {generatedUsernames.length > 0 && (
                    <motion.div
                      variants={motionVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="space-y-2"
                    >
                      <Label className="text-lime-400 font-medium text-xs uppercase tracking-wider">Suggested Handle</Label>
                      <div className="flex flex-wrap gap-2">
                        {generatedUsernames.map((username, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedUsername(username)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                              selectedUsername === username
                                ? 'bg-lime-400 border-lime-400 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            @{username}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={generateUsernames}
                          className="p-1.5 rounded-full border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
                          aria-label="Refresh handle suggestions"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lime-400 font-medium">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white pr-10"
                      placeholder="jane@example.com"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AvailabilityIndicator status={emailStatus} />
                    </div>
                  </div>
                  {emailStatus.reason && (
                    <p className="text-xs text-red-400 font-medium">{emailStatus.reason}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-lime-400 font-medium">Password *</Label>
                      {password && (
                        <span className={`text-[10px] uppercase font-bold tracking-widest ${strength.color}`}>
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="••••••••••••"
                      required
                    />
                    {password && (
                      <div className="grid grid-cols-4 gap-1 mt-1.5">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${
                              i <= strength.score ? strength.color.replace('text', 'bg') : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-1 mt-2">
                      <p className={`text-[10px] flex items-center gap-1.5 ${strength.requirements.length ? 'text-lime-400' : 'text-zinc-500'}`}>
                        {strength.requirements.length ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        AT LEAST 10 CHARACTERS
                      </p>
                      <p className={`text-[10px] flex items-center gap-1.5 ${strength.requirements.upper && strength.requirements.lower ? 'text-lime-400' : 'text-zinc-500'}`}>
                        {strength.requirements.upper && strength.requirements.lower ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        UPPER & LOWER CASE
                      </p>
                      <p className={`text-[10px] flex items-center gap-1.5 ${strength.requirements.special ? 'text-lime-400' : 'text-zinc-500'}`}>
                        {strength.requirements.special ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        NUMBER OR SPECIAL CHAR
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-lime-400 font-medium">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="••••••••••••"
                      required
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-lime-400 font-medium">Region *</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      maxLength={60}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="e.g., London, UK"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-lime-400 font-medium">Primary Genre *</Label>
                    <Input
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      maxLength={120}
                      className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                      placeholder="e.g., House / Techno"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-lime-400 font-medium text-xs uppercase tracking-widest">Verification Links (MAX 5)</Label>
                  {socialLinks.map((link, idx) => (
                    <motion.div
                      key={idx}
                      variants={motionVariants}
                      initial="initial"
                      animate="animate"
                      className="flex gap-2"
                    >
                      <Input
                        value={link}
                        onChange={(e) => updateSocialLink(idx, e.target.value)}
                        className="bg-zinc-900 border-zinc-800 focus:border-lime-400/50 transition-all text-white"
                        placeholder="https://soundcloud.com/yourname"
                        aria-label={`Social link ${idx + 1}`}
                      />
                      {idx > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeSocialLink(idx)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                        >
                          <XCircle className="w-5 h-5" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                  {socialLinks.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSocialLink}
                      className="w-full border-zinc-800 text-zinc-400 hover:text-lime-400 hover:border-lime-400/30 transition-all text-xs h-8"
                    >
                      + ADD VERIFICATION LINK
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      variants={shakeVariants}
                      animate="shake"
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3"
                    >
                      <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isSubmitting || emailStatus.available === false || artistNameStatus.available === false || strength.score < 4}
                  className="w-full bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-30 disabled:grayscale transition-all h-12 text-base font-bold shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>SECURING ACCOUNT...</span>
                    </div>
                  ) : (
                    'FINALIZE SIGN UP'
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {verificationJobId && (
        <VerificationModal
          open={showVerification}
          onOpenChange={setShowVerification}
          jobId={verificationJobId}
        />
      )}
    </>
  );
}

      {verificationJobId && (
        <VerificationModal
          open={showVerification}
          onOpenChange={setShowVerification}
          jobId={verificationJobId}
        />
      )}
    </>
  );
}