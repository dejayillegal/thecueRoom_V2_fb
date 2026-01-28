import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '../Logo';
import { SignupModal } from './SignupModal';
import { AlertCircle, Loader2, X, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'forgot';
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!email) return setEmailStatus('idle');
    const timer = setTimeout(async () => {
      setEmailStatus('checking');
      try {
        const res = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: email })
        });
        const data = await res.json();
        setEmailStatus(data.available ? 'valid' : 'invalid');
      } catch { setEmailStatus('idle'); }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

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
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
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
        setError('Recovery link dispatched to ' + email);
      } else {
        setError(data.error || 'Recovery failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const motionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut" }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        hideClose={true}
        className="w-[95vw] sm:max-w-[480px] bg-[#0B0B0B] border-white/10 p-0 overflow-hidden shadow-2xl rounded-none ring-0 focus:ring-0 max-h-[85vh] flex flex-col my-auto top-1/2 -translate-y-1/2 transition-all duration-500 ease-in-out"
      >
        <VisuallyHidden.Root>
          <DialogTitle>{tab === 'signin' ? 'Entrance' : tab === 'signup' ? 'Registry' : 'Recovery'}</DialogTitle>
          <DialogDescription>Identity Gateway</DialogDescription>
        </VisuallyHidden.Root>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-10">
            <motion.div {...motionProps} key={tab}>
              <DialogHeader className="mb-6 sm:mb-8 text-left">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-4">
                    <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                    <span className="text-[11px] sm:text-[13px] font-light tracking-[0.4em] uppercase text-white/40">thecueRoom</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-white/10 pb-4">
                  <button 
                    onClick={() => setTab('signin')}
                    className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'signin' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                  >
                    Entrance
                  </button>
                  <button 
                    onClick={() => setTab('signup')}
                    className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'signup' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                  >
                    Registry
                  </button>
                  <button 
                    onClick={() => setTab('forgot')}
                    className={`text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${tab === 'forgot' ? 'text-[#D1FF3D]' : 'text-zinc-600 hover:text-white'}`}
                  >
                    Recovery
                  </button>
                </div>

                {tab === 'signup' ? (
                  <div className="space-y-3">
                    <div className="mt-2 sm:mt-4">
                      <SignupModal 
                        open={isOpen} 
                        onOpenChange={(open) => !open && onClose()} 
                        isEmbedded={true}
                      />
                    </div>
                    <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10 text-center">
                      <p className="text-zinc-600 text-[8px] sm:text-[9px] uppercase tracking-[0.3em] font-mono">
                        Already Identified?{' '}
                        <button
                          onClick={() => setTab('signin')}
                          className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-2"
                        >
                          Entrance
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="mt-4 sm:mt-6 space-y-6 sm:space-y-8">
                      <div className="space-y-3 text-left">
                        <Label htmlFor="email" className="text-[8px] sm:text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent border-white/20 focus:border-[#D1FF3D] text-white h-12 sm:h-14 rounded-none transition-all duration-500 placeholder:text-zinc-700 focus:bg-[#0F0F0F] pl-11 pr-10 text-sm sm:text-base font-light tracking-tight border-2"
                            placeholder="Registered email"
                            required
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {emailStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin text-zinc-700" />}
                            {emailStatus === 'valid' && <span className="text-[#D1FF3D] text-[12px] font-bold">✓</span>}
                            {emailStatus === 'invalid' && <span className="text-red-500 text-[12px] font-bold">✕</span>}
                          </div>
                        </div>
                      </div>

                      {tab === 'signin' && (
                        <div className="space-y-3 text-left">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="password" className="text-[8px] sm:text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Security Pass</Label>
                            <button
                              type="button"
                              onClick={() => setTab('forgot')}
                              className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-zinc-600 hover:text-[#D1FF3D] transition-colors font-mono font-bold"
                            >
                              Lost Pass?
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                            <Input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="bg-transparent border-white/20 focus:border-[#D1FF3D] text-white h-12 sm:h-14 rounded-none transition-all duration-500 placeholder:text-zinc-700 focus:bg-[#0F0F0F] pl-11 text-sm sm:text-base font-light tracking-tight border-2"
                              placeholder="Credentials"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {error && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="flex items-center gap-3 text-red-500 text-[9px] sm:text-[10px] bg-red-500/5 p-3 sm:p-4 border border-red-500/10 font-mono uppercase tracking-[0.1em] font-bold">
                              <AlertCircle size={12} />
                              <span>{error}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-12 sm:h-14 rounded-none transition-all duration-700 uppercase tracking-[0.4em] text-[9px] sm:text-[10px] shadow-[0_0_20px_rgba(209,255,61,0.1)] active:scale-[0.98]"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Proceed'}
                      </Button>
                    </form>

                    <div className="mt-10 sm:mt-12 pt-6 border-t border-white/5 text-center">
                      <p className="text-zinc-600 text-[8px] uppercase tracking-[0.2em] font-mono">
                        {tab === 'signin' ? "No Account?" : "Identified?"}{' '}
                        <button
                          onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                          className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-2"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
