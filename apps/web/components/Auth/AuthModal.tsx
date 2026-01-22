'use client';

import { useState } from 'react';
import { SignupModal } from './SignupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Logo } from '../Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const prefersReducedMotion = useReducedMotion();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.ok) {
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setTab('signin');
      } else {
        setError(data.error || 'Failed to send recovery link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const motionProps = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20 },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px] w-[95vw] bg-[#0B0B0B] border border-white/5 p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-none ring-0 focus:ring-0 sm:rounded-none">
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 text-zinc-600 hover:text-white transition-all duration-300 z-50 p-2 hover:bg-white/5"
          aria-label="Close"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
        
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Unified Header */}
          <div className="px-8 pt-16 pb-8 sm:px-12 flex flex-col items-center text-center border-b border-white/[0.03]">
            <div className="flex flex-col items-center gap-6 mb-8 group">
              <Logo className="w-12 h-12 text-[#D1FF3D] transition-transform duration-1000 group-hover:rotate-[360deg]" />
              <div className="space-y-2">
                <h2 className="text-2xl font-light tracking-[0.3em] uppercase text-white">thecueRoom</h2>
                <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-zinc-500">Music, culture & creative intelligence</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-10 mt-4">
              {(['signin', 'signup', 'forgot'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500 relative pb-4 ${tab === t ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {t === 'signin' ? 'Entrance' : t === 'signup' ? 'Registry' : 'Recovery'}
                  {tab === t && (
                    <motion.div 
                      layoutId="activeTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-px bg-[#D1FF3D]" 
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              {tab === 'signup' ? (
                <motion.div key="signup" {...motionProps} className="p-8 sm:px-12">
                  <SignupModal 
                    open={true} 
                    onOpenChange={(open) => !open && onClose()} 
                    onSwitchToSignin={() => setTab('signin')} 
                    isEmbedded={true}
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key={tab} 
                  {...motionProps}
                  className="p-8 sm:p-12 sm:pt-14"
                >
                  <div className="mb-12">
                    <h3 className="text-3xl font-extralight tracking-tighter text-white mb-2">
                      {tab === 'signin' ? 'Welcome Back' : 'Restore Access'}
                    </h3>
                    <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#9B5CFF]/60 font-bold">
                      {tab === 'signin' ? 'Registry Identification' : 'Identity Recovery'}
                    </p>
                  </div>

                  <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="space-y-10">
                    <div className="space-y-4">
                      <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D]/60 font-bold">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-transparent border-0 border-b border-white/10 focus:border-[#D1FF3D] text-white h-12 rounded-none px-0 transition-all duration-500 placeholder:text-zinc-800 focus:ring-0 text-base"
                        placeholder="identity@network.com"
                        required
                      />
                    </div>

                    {tab === 'signin' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D]/60 font-bold">Security Pass</Label>
                          <button
                            type="button"
                            onClick={() => setTab('forgot')}
                            className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-[#D1FF3D] transition-colors font-mono"
                          >
                            Lost Pass?
                          </button>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-transparent border-0 border-b border-white/10 focus:border-[#D1FF3D] text-white h-12 rounded-none px-0 transition-all duration-500 placeholder:text-zinc-800 focus:ring-0 text-base"
                          placeholder="••••••••••••"
                          required
                        />
                      </div>
                    )}

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                        >
                          <AlertCircle size={12} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-16 rounded-none transition-all duration-700 uppercase tracking-[0.4em] text-[11px] border-none"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Initiate Session'}
                    </Button>
                  </form>

                  <div className="mt-16 pt-8 border-t border-white/[0.03] flex justify-between items-center">
                    <p className="text-zinc-700 text-[9px] font-mono uppercase tracking-[0.2em]">© 2026 thecueRoom</p>
                    <p className="text-zinc-700 text-[9px] font-mono uppercase tracking-[0.2em]">Authorized Access Only</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
