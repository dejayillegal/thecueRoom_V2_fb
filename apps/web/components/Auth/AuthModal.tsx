'use client';

import { useState } from 'react';
import { SignupModal } from './SignupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/Logo';

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
      if (data.success) {
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
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut" }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0B0B0B] border-white/10 p-0 overflow-hidden shadow-2xl rounded-none ring-0 focus:ring-0">
        <VisuallyHidden.Root>
          <DialogTitle>{tab === 'signin' ? 'Entrance' : tab === 'signup' ? 'Registry' : 'Recovery'}</DialogTitle>
          <DialogDescription>Identity Gateway</DialogDescription>
        </VisuallyHidden.Root>
        
        <div className="p-10 sm:p-12">
          <motion.div {...motionProps} key={tab}>
            <DialogHeader className="mb-12 text-left">
              <div className="flex items-center gap-6 mb-12">
                <Logo className="w-12 h-12" />
                <span className="text-[15px] font-light tracking-[0.5em] uppercase text-white/40">thecueRoom</span>
              </div>

              <div className="flex gap-8 mb-10 border-b border-white/10 pb-5">
                <button 
                  onClick={() => setTab('signin')}
                  className={`text-[11px] uppercase tracking-[0.4em] font-bold transition-all ${tab === 'signin' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Entrance
                </button>
                <button 
                  onClick={() => setTab('signup')}
                  className={`text-[11px] uppercase tracking-[0.4em] font-bold transition-all ${tab === 'signup' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Registry
                </button>
                <button 
                  onClick={() => setTab('forgot')}
                  className={`text-[11px] uppercase tracking-[0.4em] font-bold transition-all ${tab === 'forgot' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Recovery
                </button>
              </div>

              {tab === 'signup' ? (
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-white tracking-tighter mb-4">
                    Registry
                  </div>
                  <div className="text-[#9B5CFF] text-[11px] font-bold uppercase tracking-[0.4em] font-mono opacity-80">
                    Create Identity
                  </div>
                  <div className="mt-12">
                    <SignupModal 
                      open={isOpen} 
                      onOpenChange={(open) => !open && onClose()} 
                      isEmbedded={true}
                    />
                  </div>
                  <div className="mt-16 pt-10 border-t border-white/10 text-center">
                    <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] font-mono">
                      Already Identified?{' '}
                      <button
                        onClick={() => setTab('signin')}
                        className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-4"
                      >
                        Entrance
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-5xl font-bold text-white tracking-tighter mb-4">
                    {tab === 'signin' ? 'Entrance' : 'Recovery'}
                  </div>
                  <div className="text-[#9B5CFF] text-[11px] font-bold uppercase tracking-[0.4em] font-mono opacity-80">
                    Identity Gateway
                  </div>

                  <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="mt-14 space-y-12">
                    <div className="space-y-5">
                      <Label htmlFor="email" className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-transparent border-white/20 focus:border-[#D1FF3D] text-white h-16 rounded-none transition-all duration-500 placeholder:text-zinc-700 focus:bg-[#0F0F0F] px-8 text-lg font-light tracking-tight border-2"
                        placeholder="Enter your registered email"
                        required
                      />
                    </div>

                    {tab === 'signin' && (
                      <div className="space-y-5">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Security Pass</Label>
                          <button
                            type="button"
                            onClick={() => setTab('forgot')}
                            className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 hover:text-[#D1FF3D] transition-colors font-mono font-bold"
                          >
                            Lost Pass?
                          </button>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-transparent border-white/20 focus:border-[#D1FF3D] text-white h-16 rounded-none transition-all duration-500 placeholder:text-zinc-700 focus:bg-[#0F0F0F] px-8 text-lg font-light tracking-tight border-2"
                          placeholder="Enter security credentials"
                          required
                        />
                      </div>
                    )}

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-4 text-red-500 text-[11px] bg-red-500/5 p-5 border border-red-500/10 font-mono uppercase tracking-[0.2em] font-bold"
                        >
                          <AlertCircle size={14} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-16 rounded-none transition-all duration-700 uppercase tracking-[0.5em] text-[11px] shadow-[0_0_30px_rgba(209,255,61,0.1)] active:scale-[0.98]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Proceed'}
                    </Button>
                  </form>

                  <div className="mt-14 pt-8 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-mono">
                      {tab === 'signin' ? "No Account?" : "Identified?"}{' '}
                      <button
                        onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                        className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-3"
                      >
                        {tab === 'signin' ? 'Register' : 'Entrance'}
                      </button>
                    </p>
                  </div>
                </>
              )}
            </DialogHeader>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
