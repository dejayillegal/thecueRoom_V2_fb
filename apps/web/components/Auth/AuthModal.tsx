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
        
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-zinc-600 hover:text-white transition-colors z-[100]"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        
        <div className="p-10 sm:p-12">
          <motion.div {...motionProps} key={tab}>
            <DialogHeader className="mb-12 text-left">
              <div className="flex items-center gap-4 mb-10">
                <Logo className="w-8 h-8" />
                <span className="text-[10px] font-light tracking-[0.4em] uppercase text-white/40">thecueRoom</span>
              </div>

              <div className="flex gap-6 mb-8 border-b border-white/5 pb-4">
                <button 
                  onClick={() => setTab('signin')}
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'signin' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Entrance
                </button>
                <button 
                  onClick={() => setTab('signup')}
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'signup' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Registry
                </button>
                <button 
                  onClick={() => setTab('forgot')}
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'forgot' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                >
                  Recovery
                </button>
              </div>

              {tab === 'signup' ? (
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-white tracking-tight mb-3">
                    Registry
                  </div>
                  <div className="text-[#9B5CFF] text-[10px] font-bold uppercase tracking-[0.3em] font-mono opacity-80">
                    Create Identity
                  </div>
                  <div className="mt-8">
                    <SignupModal 
                      open={isOpen} 
                      onOpenChange={(open) => !open && onClose()} 
                      isEmbedded={true}
                    />
                  </div>
                  <div className="mt-14 pt-8 border-t border-white/5 text-center">
                    <p className="text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-mono">
                      Already Identified?{' '}
                      <button
                        onClick={() => setTab('signin')}
                        className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-3"
                      >
                        Entrance
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white tracking-tight mb-3">
                    {tab === 'signin' ? 'Entrance' : 'Recovery'}
                  </div>
                  <div className="text-[#9B5CFF] text-[10px] font-bold uppercase tracking-[0.3em] font-mono opacity-80">
                    Identity Gateway
                  </div>

                  <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="mt-12 space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#111111] border-white/5 focus:border-[#D1FF3D]/40 text-white h-12 rounded-none transition-all placeholder:text-zinc-800 focus:bg-[#151515]"
                        placeholder="Enter email"
                        required
                      />
                    </div>

                    {tab === 'signin' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold opacity-90">Security Pass</Label>
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
                          className="bg-[#111111] border-white/5 focus:border-[#D1FF3D]/40 text-white h-12 rounded-none transition-all placeholder:text-zinc-800 focus:bg-[#151515]"
                          placeholder="••••••••••••"
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
                          className="flex items-center gap-3 text-red-500 text-[10px] bg-red-500/5 p-4 border border-red-500/10 font-mono uppercase tracking-wider"
                        >
                          <AlertCircle size={12} />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-14 rounded-none transition-all duration-300 uppercase tracking-[0.4em] text-[10px]"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Proceed'}
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
