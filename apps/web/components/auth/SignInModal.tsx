
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthView = 'signin' | 'signup' | 'forgot';

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (view === 'signin') {
        // Sign in logic
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Sign in failed');
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else if (view === 'signup') {
        // Sign up logic
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Sign up failed');
        }

        setSuccess('Account created! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'email-link') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/${provider}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Authentication failed');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div 
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={handleCancel}
      />
      
      {/* Modal container */}
      <div className="relative w-full max-w-4xl bg-[#0F0F0F] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-[1fr_320px]">
          {/* Left side - Auth form */}
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Sign In</h2>
              
              {/* Tabs */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setView('signin')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'signin'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground hover:bg-accent'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView('signup')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'signup'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground hover:bg-accent'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setView('forgot')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    view === 'forgot'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground hover:bg-accent'
                  }`}
                >
                  Forgot
                </button>
              </div>
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/50 rounded-md flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-primary">{success}</p>
              </div>
            )}

            {view === 'forgot' ? (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <div>
                  <Label htmlFor="reset-email" className="text-sm text-foreground mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <Button
                    onClick={() => setView('signin')}
                    variant="outline"
                    className="flex-1 border-[#262626] hover:bg-accent"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-sm text-foreground mb-2 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm text-foreground mb-2 block">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#0B0B0B] border-[#262626] focus:border-primary"
                    placeholder="Use a strong password"
                    required
                  />
                  {view === 'signin' && (
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">Use a strong password.</p>
                      <button
                        type="button"
                        onClick={() => setView('forgot')}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot Password
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-[#262626] hover:bg-accent"
                  >
                    Cancel
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#262626]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0F0F0F] px-2 text-muted-foreground uppercase">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => handleSocialAuth('email-link')}
                    variant="outline"
                    className="w-full border-[#262626] hover:bg-accent justify-start"
                    disabled={isLoading}
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    Continue with Email Link
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleSocialAuth('google')}
                    variant="outline"
                    className="w-full border-[#262626] hover:bg-accent justify-start"
                    disabled={isLoading}
                  >
                    <svg className="h-4 w-4 mr-3" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleSocialAuth('apple')}
                    variant="outline"
                    className="w-full border-[#262626] hover:bg-accent justify-start"
                    disabled={isLoading}
                  >
                    <svg className="h-4 w-4 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Continue with Apple
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Popup closed is a silent no-op.
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right side - Info panel */}
          <div className="bg-[#0B0B0B] border-l border-[#262626] p-8 md:p-10">
            <h3 className="text-lg font-semibold mb-4">Welcome to thecueRoom</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Invite-first platform. Approved members get access to the gated dashboard.
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">Reduced motion respected.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">WCAG AA contrast on dark.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">Scam-free, AI-verified community.</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground">
                  Access sections: Cover Art, Memes, News, Gigs.
                </span>
              </li>
            </ul>

            <p className="text-xs text-muted-foreground">
              By continuing you agree to our Terms and Privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
