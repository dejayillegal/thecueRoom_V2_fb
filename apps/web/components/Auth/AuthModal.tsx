'use client';

import { useState } from 'react';
import { SignupModal } from './SignupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    // Implementation for forgot password
    setIsSubmitting(false);
  };

  if (tab === 'signup') {
    return <SignupModal open={isOpen} onOpenChange={(open) => !open && onClose()} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0B0B0B] border-white/10 p-0 overflow-hidden shadow-2xl">
        <div className="p-8">
          <DialogHeader className="mb-8 text-left">
            <DialogTitle className="text-2xl font-bold text-white tracking-tight">
              {tab === 'signin' ? 'Entrance' : 'Registry Recovery'}
            </DialogTitle>
            <p className="text-[#9B5CFF] text-sm font-medium">thecueRoom Access Portal</p>
          </DialogHeader>

          <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-[#D7FF3C]/50 text-white h-11"
                placeholder="email@example.com"
                required
              />
            </div>

            {tab === 'signin' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-[#D7FF3C] font-bold">Password</Label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[10px] text-zinc-500 hover:text-[#D7FF3C] transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-[#D7FF3C]/50 text-white h-11"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D7FF3C] hover:bg-[#C5EA36] text-black font-bold h-11 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : (tab === 'signin' ? 'Proceed' : 'Send Recovery Link')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-500 text-xs">
              {tab === 'signin' ? "Don't have an account?" : "Remember your password?"}{' '}
              <button
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-[#D7FF3C] hover:underline font-bold"
              >
                {tab === 'signin' ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
