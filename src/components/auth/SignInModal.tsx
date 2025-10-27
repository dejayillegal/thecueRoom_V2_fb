// components/auth/SignInModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/AuthProvider';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Info, DatabaseZap, Apple, GitBranch, X } from 'lucide-react';
import { OtpInput } from '../otp-input';

type View = 'signin' | 'signup' | 'forgot' | 'magic-link' | 'magic-link-sent';

interface SignInModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ isOpen, onOpenChange }: SignInModalProps) {
  const { user, signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('signin');


  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMessage('');
      setView('signin');
      setActiveTab('signin');
      setEmail('');
      setPassword('');
    }
  }, [isOpen]);

  const createSessionAndRedirect = async (user: any) => {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
      });
      if (res.ok) {
          onOpenChange(false);
          window.location.href = '/dashboard'; // Use full page refresh to ensure cookie is sent
      } else {
          const data = await res.json();
          setError(data.message || 'Failed to create session. Please try again.');
          setIsLoading(false);
      }
  };
  
  // Handle auto-redirect if user becomes available (e.g. after magic link)
  useEffect(() => {
    if (user && isOpen) {
      createSessionAndRedirect(user);
    }
  }, [user, isOpen]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (view === 'signin') {
        const userCredential = await signIn(email, password);
        await createSessionAndRedirect(userCredential.user);

      } else if (view === 'signup') {
        const userCredential = await signUp(email, password);
        setSuccessMessage('Account created! Check your email for verification.');
        
        const idToken = await userCredential.user.getIdToken();
        const res = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });

        if (res.ok) {
            setTimeout(() => {
                onOpenChange(false);
                window.location.href = '/onboarding';
            }, 2000);
        } else {
             const data = await res.json();
             throw new Error(data.message || 'Failed to create session after signup.');
        }

      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setError('');
    setIsLoading(true);
    try {
        const userCredential = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
        await createSessionAndRedirect(userCredential.user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'An error occurred during social sign-in.');
      }
      setIsLoading(false); // Only set loading false on error
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="auth-modal-backdrop">
      <div className="auth-modal-container" data-view={view}>
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
          </button>
         <div className="auth-grid">
            <div className="auth-content">
                <div className="mb-6">
                    <h3 className="auth-title mb-2">
                        {view === 'signin' && 'Sign In'}
                        {view === 'signup' && 'Create Account'}
                        {view === 'forgot' && 'Reset Password'}
                    </h3>
                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab-button ${activeTab === 'signin' ? 'active' : ''}`} 
                            onClick={() => { setView('signin'); setActiveTab('signin'); }}>
                            Sign In
                        </button>
                         <button 
                            className={`auth-tab-button ${activeTab === 'signup' ? 'active' : ''}`} 
                            onClick={() => { setView('signup'); setActiveTab('signup'); }}>
                            Sign Up
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/50 text-destructive text-xs rounded-md p-3 mb-4 flex gap-2">
                        <AlertCircle className="size-4" />
                        <p>{error}</p>
                    </div>
                )}
                 {successMessage && (
                    <div className="bg-primary/10 border border-primary/50 text-primary text-xs rounded-md p-3 mb-4 flex gap-2">
                        <Info className="size-4" />
                        <p>{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {(view === 'signin' || view === 'signup') && (
                        <>
                            <div>
                                <label className="auth-label" htmlFor="email">Email</label>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="auth-label" htmlFor="password">Password</label>
                                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="Use a strong password" />
                            </div>
                        </>
                    )}
                    
                    {view === 'signin' && (
                        <>
                           <div className="flex justify-end items-center text-xs">
                                <button type="button" onClick={() => { setView('forgot'); setActiveTab('forgot'); }} className="text-primary hover:underline">Forgot Password</button>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={isLoading} className="auth-button-primary w-full justify-center">Continue</button>
                                <button type="button" onClick={() => onOpenChange(false)} className="auth-button-secondary w-full">Cancel</button>
                            </div>
                        </>
                    )}

                     {view === 'signup' && (
                         <>
                            <p className="text-xs text-muted-foreground">By signing up, you agree to our terms of service.</p>
                            <button type="submit" disabled={isLoading} className="auth-button-primary w-full justify-center">Create Account</button>
                        </>
                    )}
                </form>
                
                 {view === 'forgot' && (
                     <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
                        <div>
                            <label className="auth-label" htmlFor="forgot-email">Email</label>
                            <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handlePasswordReset} disabled={isLoading} className="auth-button-primary w-full justify-center">Send Reset Link</button>
                            <button type="button" onClick={() => { setView('signin'); setActiveTab('signin');}} className="auth-button-secondary w-full">Back to Sign In</button>
                        </div>
                    </div>
                )}
            </div>
            <aside className="auth-right-rail">
                <h4 className="font-semibold text-foreground text-sm mb-3">Welcome to thecueRoom</h4>
                <p className="mb-4">Invite-first platform. Approved members get access to the gated dashboard.</p>
                 <ul className="space-y-2 text-xs">
                    <li className="flex gap-2 items-center"><DatabaseZap className="size-4 shrink-0 text-primary"/>Reduced motion respected.</li>
                    <li className="flex gap-2 items-center"><DatabaseZap className="size-4 shrink-0 text-primary"/>WCAG AA contrast on dark.</li>
                    <li className="flex gap-2 items-center"><DatabaseZap className="size-4 shrink-0 text-primary"/>Scam-free, AI-verified community.</li>
                    <li className="flex gap-2 items-center"><DatabaseZap className="size-4 shrink-0 text-primary"/>Access sections: Cover Art, Memes, News, Gigs.</li>
                 </ul>
                <p className="mt-4 text-xs">By continuing you agree to our Terms and Privacy.</p>
            </aside>
         </div>
      </div>
    </div>
  );
}
