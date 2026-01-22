'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { VerificationModal } from '../Auth/VerificationModal';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToSignin?: () => void;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

export function SignupModal({ open, onOpenChange, onSwitchToSignin }: SignupModalProps) {
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

  const motionProps = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto bg-[#0B0B0B] border-white/10 p-0 shadow-2xl rounded-none ring-0 focus:ring-0">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-6 top-6 text-zinc-600 hover:text-white transition-colors z-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="p-10 sm:p-14">
            <motion.div {...motionProps}>
              <DialogHeader className="mb-14 text-left">
                <div className="flex gap-6 mb-8 border-b border-white/5 pb-4">
                  <button 
                    onClick={onSwitchToSignin}
                    className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 hover:text-white transition-all"
                  >
                    Entrance
                  </button>
                  <button 
                    className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#D1FF3D]"
                  >
                    Registry
                  </button>
                  <button 
                    onClick={onSwitchToSignin}
                    className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 hover:text-white transition-all"
                  >
                    Recovery
                  </button>
                </div>
                <DialogTitle className="text-3xl font-bold text-white tracking-tight mb-3">Registry</DialogTitle>
                <DialogDescription className="text-[#9B5CFF] text-[10px] font-bold uppercase tracking-[0.3em] font-mono opacity-80">Onboarding Process</DialogDescription>
              </DialogHeader>

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
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-10">
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        type="button"
                        onClick={() => setIsArtist(true)}
                        className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border rounded-none transition-all ${isArtist ? 'bg-[#D1FF3D] border-[#D1FF3D] text-black' : 'bg-transparent border-white/5 text-zinc-500'}`}
                      >
                        Artist
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsArtist(false)}
                        className={`flex-1 py-3 text-[10px] uppercase tracking-widest font-bold border rounded-none transition-all ${!isArtist ? 'bg-[#D1FF3D] border-[#D1FF3D] text-black' : 'bg-transparent border-white/5 text-zinc-500'}`}
                      >
                        Enthusiast
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">First Name</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="Given" required />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Last Name</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="Surname" required />
                      </div>
                    </div>

                    {isArtist && (
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Artist Alias</Label>
                        <div className="relative">
                          <Input value={artistName} onChange={e => setArtistName(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 pr-10 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="Stage Name" required />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2"><AvailabilityIndicator status={artistNameStatus} /></div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Email Address</Label>
                      <div className="relative">
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 pr-10 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="email@provider.com" required />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2"><AvailabilityIndicator status={emailStatus} /></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Security Pass</Label>
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="10+ characters" required />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Confirm Pass</Label>
                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="Repeat password" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Region</Label>
                        <Input value={region} onChange={e => setRegion(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="City, Country" required />
                      </div>
                      {isArtist && (
                        <div className="space-y-3">
                          <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Primary Genre</Label>
                          <Input value={genre} onChange={e => setGenre(e.target.value)} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="Main genre" required />
                        </div>
                      )}
                    </div>

                    {isArtist && (
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Verification Source</Label>
                        <Input value={socialLinks[0]} onChange={e => setSocialLinks([e.target.value])} className="bg-[#111111] border-white/5 text-white h-12 rounded-none placeholder:text-zinc-800 focus:bg-[#151515]" placeholder="SoundCloud / Spotify URL" required />
                      </div>
                    )}

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 text-red-500 text-[10px] bg-red-500/5 p-4 border border-red-500/10 font-mono uppercase tracking-wider"
                        >
                          <AlertCircle size={12} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button type="submit" disabled={isSubmitting} className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-16 rounded-none transition-all duration-300 uppercase tracking-[0.4em] text-[10px]">
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Finalize Registry'}
                    </Button>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
      {verificationJobId && <VerificationModal open={showVerification} onOpenChange={setShowVerification} jobId={verificationJobId} />}
    </>
  );
}
