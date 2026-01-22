'use client';

import { useState } from 'react';
import { SignupModal } from './SignupModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, X } from 'lucide-react';

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
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setTab('signin');
        alert('Recovery link sent if account exists.');
      } else {
        setError(data.error || 'Failed to send recovery link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tab === 'signup') {
    return <SignupModal open={isOpen} onOpenChange={(open) => !open && onClose()} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0B0B0B] border-white/10 p-0 overflow-hidden shadow-2xl rounded-none sm:rounded-none">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors z-50"
        >
          <X size={20} />
        </button>
        
        <div className="p-8 sm:p-10">
          <DialogHeader className="mb-10 text-left">
            <DialogTitle className="text-3xl font-bold text-white tracking-tight mb-2">
              {tab === 'signin' ? 'Entrance' : 'Recovery'}
            </DialogTitle>
            <DialogDescription className="text-[#9B5CFF] text-sm font-medium uppercase tracking-widest font-mono">
              Registry Access
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={tab === 'signin' ? handleSignIn : handleForgot} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#111111] border-white/5 focus:border-[#D1FF3D]/30 text-white h-12 rounded-none transition-all placeholder:text-zinc-700"
                placeholder="email@example.com"
                required
              />
            </div>

            {tab === 'signin' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] text-[#D1FF3D] font-bold">Security Pass</Label>
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
                  className="bg-[#111111] border-white/5 focus:border-[#D1FF3D]/30 text-white h-12 rounded-none transition-all placeholder:text-zinc-700"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-3 text-red-500 text-[11px] bg-red-500/5 p-4 border border-red-500/10 font-mono uppercase tracking-wider">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-14 rounded-none transition-all duration-500 uppercase tracking-[0.3em] text-xs"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Proceed'}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em]">
              {tab === 'signin' ? "No Account?" : "Identified?"}{' '}
              <button
                onClick={() => setTab(tab === 'signin' ? 'signup' : 'signin')}
                className="text-[#D1FF3D] hover:text-white transition-colors font-bold ml-2"
              >
                {tab === 'signin' ? 'Register' : 'Entrance'}
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
