'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Info } from 'lucide-react';
import VerificationModal from '@/src/components/Auth/VerificationModal';
import { useRouter } from 'next/navigation';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'signin' | 'signup' | 'forgot';

const PASSWORD_MIN_LENGTH = 10;

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('signin');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sign up additional fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');

  // Verification state
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Reset form when modal closes or tab changes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [activeTab]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setArtistName('');
    setRegion('');
    setGenre('');
    setError('');
    setSuccess('');
    setIsLoading(false);
    setActiveTab('signin');
    setVerificationJobId(null);
    setShowVerificationModal(false);
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)) {
      return 'Password must include a number or special character';
    }
    return null;
  };

  const generateUsername = (name: string): string => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.floor(Math.random() * 9999);
    return `${clean}${random}`;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      onClose();
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password || !firstName || !lastName || !artistName || !region || !genre) {
        setError('Please fill in all required fields');
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const username = generateUsername(artistName);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          artistName,
          email,
          password,
          username,
          region,
          genre,
          socialLinks: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Show verification modal
      setVerificationJobId(data.jobId);
      setShowVerificationModal(true);
    } catch (err) {
      console.error('Sign up error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!email) {
        setError('Please enter your email address');
        return;
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSuccess('Password reset email sent! Check your inbox.');
      setEmail('');
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthContinue = (provider: string) => {
    console.log(`OAuth with ${provider} - Coming soon`);
    setError(`${provider} authentication coming soon`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[820px] bg-black border border-[#2a2a2a] text-white p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Sign Up' : 'Forgot Password'}
          </DialogTitle>
          <div className="grid grid-cols-[1fr_340px]">
            {/* Left Column - Auth Forms */}
            <div className="p-8">
              {/* Header with Tabs */}
              <h2 className="text-xl font-semibold mb-6">Sign In</h2>
              <div className="flex gap-1 mb-8">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'signin'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'signup'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('forgot')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'forgot'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Forgot
                </button>
              </div>

              {/* Sign In Form */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm text-gray-400">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm text-gray-400">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Use a strong password.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-white hover:text-[#D7FF3C] font-medium"
                      disabled={isLoading}
                    >
                      Forgot Password
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#2a2a2a]"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black px-2 text-gray-500">OR CONTINUE WITH</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleOAuthContinue('Email Link')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] transition-colors text-left"
                      disabled={isLoading}
                    >
                      <Mail className="h-5 w-5" />
                      <span>Continue with Email Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthContinue('Google')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] transition-colors text-left"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthContinue('Apple')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:bg-[#1a1a1a] transition-colors text-left"
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span>Continue with Apple</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-400 mt-4">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>Popup closed is a silent no-op.</p>
                  </div>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">First Name *</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Last Name *</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Artist Name *</Label>
                    <Input
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Email *</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Password *</Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Confirm Password *</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Region *</Label>
                      <Input
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g. Berlin, EU"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Genre *</Label>
                      <Input
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="e.g. Techno, House"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Forgot Password Form */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm text-gray-400">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column - Welcome Panel */}
            <div className="bg-[#0a0a0a] border-l border-[#2a2a2a] p-8">
              <h2 className="text-xl font-semibold mb-4">Welcome to thecueRoom</h2>
              <p className="text-sm text-gray-400 mb-6">
                Invite-first platform. Approved members get access to the gated dashboard.
              </p>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">Reduced motion respected.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">WCAG AA contrast on dark.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">Scam-free, AI-verified community.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">Access sections: Cover Art, Memes, News, Gigs.</span>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-[#2a2a2a] text-xs text-gray-500">
                By continuing you agree to our Terms and Privacy.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {verificationJobId && (
        <VerificationModal
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
          jobId={verificationJobId}
          onComplete={() => {
            setShowVerificationModal(false);
            router.push('/dashboard');
            router.refresh();
          }}
        />
      )}
    </>
  );
}
