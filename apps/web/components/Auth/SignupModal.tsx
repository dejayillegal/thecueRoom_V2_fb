'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { VerificationModal } from '../Auth/VerificationModal';
import { motion, AnimatePresence } from 'framer-motion';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);

  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({ checking: false, available: null });
  const [artistNameStatus, setArtistNameStatus] = useState<AvailabilityStatus>({ checking: false, available: null });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  const getPasswordStrength = (pass: string) => {
    const met = [pass.length >= 10, /[A-Z]/.test(pass), /[a-z]/.test(pass), /[0-9!@#$%^&*]/.test(pass)].filter(Boolean).length;
    return { score: met, label: met === 4 ? 'Strong' : met >= 2 ? 'Fair' : 'Weak', color: met === 4 ? 'text-[#D7FF3C]' : met >= 2 ? 'text-yellow-400' : 'text-red-400' };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!email) return setEmailStatus({ checking: false, available: null });
    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'email', value: email }) });
        const data = await res.json();
        setEmailStatus({ checking: false, available: data.available, reason: data.reason });
      } catch { setEmailStatus({ checking: false, available: null }); }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!artistName) return setArtistNameStatus({ checking: false, available: null });
    const timer = setTimeout(async () => {
      setArtistNameStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'artist', value: artistName }) });
        const data = await res.json();
        setArtistNameStatus({ checking: false, available: data.available, reason: data.reason });
      } catch { setArtistNameStatus({ checking: false, available: null }); }
    }, 500);
    return () => clearTimeout(timer);
  }, [artistName]);

  const generateUsernames = useCallback(() => {
    if (!artistName) return;
    const normalized = artistName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '.');
    const suggestions = ['sub', 'grid', 'void', 'flux'].map(s => `${normalized}.${s}${Math.random().toString(36).substring(2, 5)}`);
    setGeneratedUsernames(suggestions);
    setSelectedUsername(suggestions[0]);
  }, [artistName]);

  useEffect(() => { if (artistName && artistNameStatus.available) generateUsernames(); }, [artistName, artistNameStatus.available, generateUsernames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (strength.score < 4) return setError('Security requirements not met');
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, artistName, email, password, confirmPassword, username: selectedUsername, region, genre, isArtist: true, artistProfile: { profileUrl: socialLinks[0] || '', genre, socialLinks: socialLinks.filter(l => l.trim()) } })
      });
      const data = await res.json();
      if (!data.ok) return setError(data.error || 'Registration failed'), setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => { setVerificationJobId(data.jobId); setShowVerification(true); onOpenChange(false); }, 600);
    } catch { setError('Protocol error. Try again.'); setIsSubmitting(false); }
  };

  const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
    if (status.checking) return <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />;
    if (status.available === true) return <CheckCircle2 className="w-4 h-4 text-[#D7FF3C]" />;
    if (status.available === false) return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B0B0B] border-white/10 p-0 shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-8 text-left">
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">Registry</DialogTitle>
              <p className="text-[#9B5CFF] text-sm font-medium">thecueRoom Access Portal</p>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-[#D7FF3C] mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Registry Complete</h3>
                  <p className="text-zinc-500 text-sm">Initiating verification...</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">First Name</Label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="First" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Last Name</Label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="Last" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Artist Alias</Label>
                    <div className="relative">
                      <Input value={artistName} onChange={e => setArtistName(e.target.value)} className="bg-white/5 border-white/10 text-white h-11 pr-10" placeholder="Artist Name" required />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2"><AvailabilityIndicator status={artistNameStatus} /></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Email Address</Label>
                    <div className="relative">
                      <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white h-11 pr-10" placeholder="email@example.com" required />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2"><AvailabilityIndicator status={emailStatus} /></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Security Pass</Label>
                      <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="••••••••••••" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Confirm Pass</Label>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="••••••••••••" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Region</Label>
                      <Input value={region} onChange={e => setRegion(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="City, Country" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Primary Genre</Label>
                      <Input value={genre} onChange={e => setGenre(e.target.value)} className="bg-white/5 border-white/10 text-white h-11" placeholder="Genre" required />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Verification Source</Label>
                    <Input value={socialLinks[0]} onChange={e => setSocialLinks([e.target.value])} className="bg-white/5 border-white/10 text-white h-11" placeholder="SoundCloud / Spotify URL" required />
                  </div>

                  {error && <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20"><AlertCircle size={14} /><span>{error}</span></div>}

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D7FF3C] hover:bg-[#C5EA36] text-black font-bold h-12 text-base tracking-tight">{isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Registration'}</Button>
                </form>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
      {verificationJobId && <VerificationModal open={showVerification} onOpenChange={setShowVerification} jobId={verificationJobId} />}
    </>
  );
}
