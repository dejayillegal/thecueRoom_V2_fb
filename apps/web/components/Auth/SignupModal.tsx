'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { VerificationModal } from '../Auth/VerificationModal';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignin?: () => void;
  isEmbedded?: boolean;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

export function SignupModal({ open, onOpenChange, onSwitchToSignin, isEmbedded = false }: SignupModalProps) {
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
  const [isArtist, setIsArtist] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  
  const prefersReducedMotion = useReducedMotion();
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({ checking: false, available: null });
  const [artistNameStatus, setArtistNameStatus] = useState<AvailabilityStatus>({ checking: false, available: null });

  const getPasswordStrength = (pass: string) => {
    const met = [pass.length >= 10, /[A-Z]/.test(pass), /[a-z]/.test(pass), /[0-9!@#$%^&*]/.test(pass)].filter(Boolean).length;
    return { score: met, label: met === 4 ? 'Strong' : met >= 2 ? 'Fair' : 'Weak', color: met === 4 ? 'text-[#D1FF3D]' : met >= 2 ? 'text-yellow-400' : 'text-red-400' };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!email) return setEmailStatus({ checking: false, available: null });
    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ type: 'email', value: email }) 
        });
        const data = await res.json();
        setEmailStatus({ checking: false, available: data.available, reason: data.reason });
      } catch { setEmailStatus({ checking: false, available: null }); }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!artistName || !isArtist) return setArtistNameStatus({ checking: false, available: null });
    const timer = setTimeout(async () => {
      setArtistNameStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ type: 'artist', value: artistName }) 
        });
        const data = await res.json();
        setArtistNameStatus({ checking: false, available: data.available, reason: data.reason });
      } catch { setArtistNameStatus({ checking: false, available: null }); }
    }, 500);
    return () => clearTimeout(timer);
  }, [artistName, isArtist]);

  useEffect(() => {
    if (isArtist && artistName && artistNameStatus.available) {
      const normalized = artistName.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\s+/g, '.');
      setSelectedUsername(`${normalized}.${Math.random().toString(36).substring(2, 5)}`);
    } else if (!isArtist && email) {
      const normalized = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setSelectedUsername(`${normalized}.${Math.random().toString(36).substring(2, 5)}`);
    }
  }, [artistName, artistNameStatus.available, isArtist, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (strength.score < 4) return setError('Security requirements not met');
    if (isArtist && artistNameStatus.available === false) return setError('Artist name is unavailable');
    if (emailStatus.available === false) return setError('Email is already registered');

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          artistName: isArtist ? artistName : undefined, 
          email, 
          password, 
          confirmPassword, 
          username: selectedUsername, 
          region, 
          genre: isArtist ? genre : undefined, 
          isArtist, 
          artistProfile: isArtist ? { profileUrl: socialLinks[0] || '', genre, socialLinks: socialLinks.filter(l => l.trim()) } : undefined 
        })
      });
      const data = await res.json();
      if (!data.ok) return setError(data.error || 'Registration failed'), setIsSubmitting(false);
      
      setSuccess(true);
      if (isArtist) {
        setTimeout(() => { setVerificationJobId(data.jobId); setShowVerification(true); onOpenChange(false); }, 600);
      } else {
        setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
      }
    } catch { setError('Communication error. Please try again.'); setIsSubmitting(false); }
  };

  const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
    if (status.checking) return <Loader2 className="w-3 h-3 animate-spin text-zinc-700" />;
    if (status.available === true) return <CheckCircle2 className="w-3 h-3 text-[#D1FF3D]" />;
    if (status.available === false) return <XCircle className="w-3 h-3 text-red-500" />;
    return null;
  };

  const content = (
    <div className={isEmbedded ? '' : 'p-10 sm:p-14'}>
      {!isEmbedded && (
        <div className="mb-10">
          <h3 className="text-3xl font-extralight tracking-tighter text-white mb-2">Create Account</h3>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9B5CFF]/60 font-bold">Registry Access</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-[#D1FF3D] mb-6" />
            <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Success</h3>
            <p className="text-zinc-600 font-mono text-[9px] uppercase tracking-[0.3em]">{isArtist ? 'Identity pending verification...' : 'Redirecting to dashboard...'}</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] uppercase tracking-[0.3em] text-[#D1FF3D] font-bold opacity-90">First Name</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-[#111111] border-white/5 text-white h-14 rounded-none px-6 transition-all duration-500 focus:border-[#D1FF3D] focus:ring-0 text-base font-light tracking-tight" placeholder="First" required />
              </div>
              <div className="space-y-4">
                <Label className="text-[11px] uppercase tracking-[0.3em] text-[#D1FF3D] font-bold opacity-90">Last Name</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-[#111111] border-white/5 text-white h-14 rounded-none px-6 transition-all duration-500 focus:border-[#D1FF3D] focus:ring-0 text-base font-light tracking-tight" placeholder="Last" required />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[11px] uppercase tracking-[0.3em] text-[#D1FF3D] font-bold opacity-90">Email Address</Label>
              <div className="relative">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#111111] border-white/5 text-white h-14 pr-12 rounded-none px-6 transition-all duration-500 focus:border-[#D1FF3D] focus:ring-0 text-base font-light tracking-tight" placeholder="identity@network.com" required />
                <div className="absolute right-6 top-1/2 -translate-y-1/2"><AvailabilityIndicator status={emailStatus} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label className="text-[11px] uppercase tracking-[0.3em] text-[#D1FF3D] font-bold opacity-90">Security Pass</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#111111] border-white/5 text-white h-14 rounded-none px-6 transition-all duration-500 focus:border-[#D1FF3D] focus:ring-0 text-base font-light tracking-tight" placeholder="10+ characters" required />
              </div>
              <div className="space-y-4">
                <Label className="text-[11px] uppercase tracking-[0.3em] text-[#D1FF3D] font-bold opacity-90">Confirm Pass</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-[#111111] border-white/5 text-white h-14 rounded-none px-6 transition-all duration-500 focus:border-[#D1FF3D] focus:ring-0 text-base font-light tracking-tight" placeholder="Confirm" required />
              </div>
            </div>

            <div className="py-4">
              <div className="flex items-center gap-4">
                <Switch
                  id="artist-mode"
                  checked={isArtist}
                  onCheckedChange={setIsArtist}
                  className="data-[state=checked]:bg-[#D1FF3D] scale-110"
                />
                <Label
                  htmlFor="artist-mode"
                  className="text-[11px] font-mono uppercase tracking-[0.4em] text-[#D1FF3D] cursor-pointer font-bold"
                >
                  Register as Artist
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-16 rounded-none transition-all duration-700 uppercase tracking-[0.5em] text-[11px] border-none group active:scale-[0.98] shadow-[0_0_30px_rgba(209,255,61,0.1)]">
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <div className="flex items-center justify-center gap-3">
                  <span>Create Identity</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              )}
            </Button>
          </form>
        )}
      </AnimatePresence>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          hideClose
          className="max-w-2xl max-h-[95vh] overflow-y-auto bg-[#0B0B0B] border-white/10 p-0 shadow-2xl rounded-none ring-0 focus:ring-0"
        >
          <VisuallyHidden.Root>
            <DialogTitle>Create Account</DialogTitle>
          </VisuallyHidden.Root>
          {content}
        </DialogContent>
      </Dialog>
      {verificationJobId && <VerificationModal open={showVerification} onOpenChange={setShowVerification} jobId={verificationJobId} />}
    </>
  );
}
