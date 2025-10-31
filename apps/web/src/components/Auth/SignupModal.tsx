'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Loader2, RefreshCw, AlertCircle, Radio, MapPin, Music2 } from 'lucide-react';
import { useDebounce } from '@/src/hooks/use-debounce';
import { generateUsername } from '@/src/lib/username-generator';
import VerificationModal from '@/src/components/Auth/VerificationModal';
import { useRouter } from 'next/navigation';


interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'signin' | 'signup' | 'forgot';

interface AvailabilityState {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

const PASSWORD_MIN_LENGTH = 10;

const curatedNews = [
  { city: 'Berlin', genre: 'Techno', icon: Radio },
  { city: 'Detroit', genre: 'House', icon: Music2 },
  { city: 'London', genre: 'Bass', icon: MapPin },
];


export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('signin');
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sign Up state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    artistName: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
    genre: '',
    socialLinks: ['']
  });

  const [autoUsername, setAutoUsername] = useState('');
  const [usernameAlternatives, setUsernameAlternatives] = useState<string[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const [availability, setAvailability] = useState<{
    artistName: AvailabilityState;
    email: AvailabilityState;
    username: AvailabilityState;
  }>({
    artistName: { checking: false, available: null },
    email: { checking: false, available: null },
    username: { checking: false, available: null }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const debouncedArtistName = useDebounce(formData.artistName, 400);
  const debouncedEmail = useDebounce(formData.email, 400);
  const debouncedUsername = useDebounce(autoUsername, 400);

  // Generate username when artist name changes
  useEffect(() => {
    if (formData.artistName && formData.artistName.length >= 2) {
      const generated = generateUsername(formData.artistName);
      setAutoUsername(generated);
      setShowAlternatives(false);
    }
  }, [formData.artistName]);

  // Check artist name availability
  useEffect(() => {
    if (debouncedArtistName && debouncedArtistName.length >= 2) {
      checkAvailability('artist', debouncedArtistName);
    }
  }, [debouncedArtistName]);

  // Check email availability
  useEffect(() => {
    if (debouncedEmail && debouncedEmail.includes('@')) {
      checkAvailability('email', debouncedEmail);
    }
  }, [debouncedEmail]);

  // Check username availability
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkAvailability('username', debouncedUsername);
    }
  }, [debouncedUsername]);

  const checkAvailability = async (type: 'email' | 'artist' | 'username', value: string) => {
    const key = type === 'artist' ? 'artistName' : type;
    
    setAvailability(prev => ({
      ...prev,
      [key]: { checking: true, available: null }
    }));

    try {
      const response = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value })
      });

      const data = await response.json();

      if (response.status === 429) {
        setAvailability(prev => ({
          ...prev,
          [key]: { checking: false, available: null, reason: 'Rate limit exceeded' }
        }));
        return;
      }

      setAvailability(prev => ({
        ...prev,
        [key]: { checking: false, available: data.available, reason: data.reason }
      }));
    } catch (error) {
      setAvailability(prev => ({
        ...prev,
        [key]: { checking: false, available: null }
      }));
    }
  };

  const regenerateUsername = () => {
    if (!formData.artistName) return;
    const alternatives = Array.from({ length: 3 }, () => generateUsername(formData.artistName));
    setUsernameAlternatives(alternatives);
    setShowAlternatives(true);
  };

  const addSocialLink = () => {
    if (formData.socialLinks.length < 5) {
      setFormData(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, '']
      }));
    }
  };

  const updateSocialLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const validatePassword = (password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return `Minimum ${PASSWORD_MIN_LENGTH} characters required`;
    }
    if (!/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) {
      return 'Must include a number or special character';
    }
    return null;
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setIsSigningIn(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInEmail,
          password: signInPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignInError(data.error || 'Invalid email or password');
        return;
      }

      onClose();
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Sign in error:', error);
      setSignInError('An error occurred. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {};
      
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.artistName) newErrors.artistName = 'Artist name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.region) newErrors.region = 'Region is required';
      if (!formData.genre) newErrors.genre = 'Genre is required';
      
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Check availability
      if (availability.artistName.available === false) {
        newErrors.artistName = 'Artist name is not available';
      }
      if (availability.email.available === false) {
        newErrors.email = 'Email is already registered';
      }
      if (availability.username.available === false) {
        newErrors.submit = 'Username is not available';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Submit signup
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          artistName: formData.artistName,
          email: formData.email,
          password: formData.password,
          username: autoUsername,
          region: formData.region,
          genre: formData.genre,
          socialLinks: formData.socialLinks.filter(link => link.trim() !== ''),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || 'Failed to create account' });
        return;
      }

      // Show verification modal
      setVerificationJobId(data.jobId);
      setShowVerificationModal(true);
    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    setIsSendingReset(true);

    try {
      if (!forgotEmail) {
        setForgotError('Please enter your email address');
        return;
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.error || 'Failed to send reset email');
        return;
      }

      setForgotSuccess(true);
      setForgotEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      setForgotError('An error occurred. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSignInEmail('');
      setSignInPassword('');
      setSignInError('');
      setActiveTab('signin');
      setFormData({
        firstName: '',
        lastName: '',
        artistName: '',
        email: '',
        password: '',
        confirmPassword: '',
        region: '',
        genre: '',
        socialLinks: ['']
      });
      setErrors({});
      setAutoUsername('');
      setUsernameAlternatives([]);
      setShowAlternatives(false);
      setAvailability({
        artistName: { checking: false, available: null },
        email: { checking: false, available: null },
        username: { checking: false, available: null }
      });
      setForgotEmail('');
      setForgotError('');
      setForgotSuccess(false);
      setIsSendingReset(false);
      setVerificationJobId(null);
      setShowVerificationModal(false);
    }
  }, [isOpen]);


  const AvailabilityIndicator = ({ state }: { state: AvailabilityState }) => {
    if (state.checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-live="polite" aria-label="Checking availability" />;
    }
    if (state.available === true) {
      return <Check className="h-4 w-4 text-[#D7FF3C]" aria-label="Available" />;
    }
    if (state.available === false) {
      return <X className="h-4 w-4 text-red-500" aria-label="Not available" />;
    }
    return null;
  };

  // No longer needed as VerificationModal is rendered conditionally at the end
  // if (verificationJobId && showVerificationModal) {
  //   return (
  //     <VerificationModal
  //       open={showVerificationModal}
  //       onOpenChange={setShowVerificationModal}
  //       jobId={verificationJobId}
  //       onComplete={() => {
  //         setShowVerificationModal(false);
  //         window.location.href = '/dashboard';
  //       }}
  //     />
  //   );
  // }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[900px] max-h-[85vh] bg-black border border-[#1a1a1a] text-white p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Sign Up' : 'Forgot Password'}
          </DialogTitle>
          <div className="grid grid-cols-[1fr_320px] h-full max-h-[85vh]">
            {/* Left Column - Auth Forms */}
            <div className="p-8 overflow-y-auto">
            {/* Header with Tabs */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Sign in to TheCueRoom</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`px-4 py-1.5 text-sm font-medium rounded ${
                    activeTab === 'signin'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent border border-[#333] text-white hover:border-[#555]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`px-4 py-1.5 text-sm font-medium rounded ${
                    activeTab === 'signup'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent border border-[#333] text-white hover:border-[#555]'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('forgot')}
                  className={`px-4 py-1.5 text-sm font-medium rounded ${
                    activeTab === 'forgot'
                      ? 'bg-[#D7FF3C] text-black'
                      : 'bg-transparent border border-[#333] text-white hover:border-[#555]'
                  }`}
                >
                  Forgot
                </button>
              </div>
            </div>

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm text-gray-400">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="you@artistmail.com"
                    className="bg-[#0a0a0a] border-[#333] text-white h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm text-gray-400">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-[#0a0a0a] border-[#333] text-white h-11"
                  />
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab('forgot')}
                    className="text-gray-400 hover:text-white"
                  >
                    Forgot password?
                  </button>
                </div>

                {signInError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                    {signInError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSigningIn}
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-medium h-10 px-6"
                  >
                    {isSigningIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In
                      </>
                    ) : (
                      <>→ Sign In</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-[#333] bg-transparent text-white hover:bg-[#1a1a1a] h-10"
                  >
                    Back
                  </Button>
                </div>

                <div className="flex items-start gap-2 p-3 bg-[#0a0a0a] border border-[#333] rounded text-sm text-gray-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>New: Artist profiles are AI-verified after sign-up to keep the community real.</p>
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
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                    {errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                    {errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Artist Name *</Label>
                  <div className="relative">
                    <Input
                      value={formData.artistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11 pr-10"
                    />
                    <div className="absolute right-3 top-3">
                      <AvailabilityIndicator state={availability.artistName} />
                    </div>
                  </div>
                  {availability.artistName.reason && (
                    <p className="text-xs text-red-400">{availability.artistName.reason}</p>
                  )}
                </div>

                {autoUsername && (
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Username (auto-generated)</Label>
                    <div className="relative">
                      <Input
                        value={autoUsername}
                        readOnly
                        className="bg-[#0a0a0a] border-[#333] text-white h-11 pr-10"
                      />
                      <div className="absolute right-3 top-3">
                        <AvailabilityIndicator state={availability.username} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={regenerateUsername}
                      className="text-xs text-[#D7FF3C] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm text-gray-400">Email *</Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11 pr-10"
                    />
                    <div className="absolute right-3 top-3">
                      <AvailabilityIndicator state={availability.email} />
                    </div>
                  </div>
                  {availability.email.reason && (
                    <p className="text-xs text-red-400">{availability.email.reason}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Password *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                    {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Confirm *</Label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Region *</Label>
                    <Input
                      value={formData.region}
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      placeholder="EU — Berlin"
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Genre *</Label>
                    <Input
                      value={formData.genre}
                      onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder="Techno, House"
                      className="bg-[#0a0a0a] border-[#333] text-white h-11"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                    {errors.submit}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-medium h-10 px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-[#333] bg-transparent text-white hover:bg-[#1a1a1a] h-10"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm text-gray-400">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@artistmail.com"
                    className="bg-[#0a0a0a] border-[#333] text-white h-11"
                  />
                </div>

                {forgotError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                    {forgotError}
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
                    Password reset email sent! Check your inbox.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSendingReset}
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-medium h-10 px-6"
                  >
                    {isSendingReset ? (
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
                    className="border-[#333] bg-transparent text-white hover:bg-[#1a1a1a] h-10"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column - Curated News Rail */}
          <div className="bg-[#0a0a0a] border-l border-[#1a1a1a] p-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-3 text-sm">Curated News Rail</h3>
              <p className="text-xs text-gray-400 mb-4">
                Genre + region filters to surface underground techno/house stories. Verified sources only.
              </p>
              
              <div className="space-y-2">
                {curatedNews.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-black/50 rounded text-xs hover:bg-black/70 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 text-[#D1FF3D]" />
                        <span className="text-white">{item.city}</span>
                      </div>
                      <span className="text-gray-400">{item.genre}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-sm">What happens next?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                After you press Sign In, we authenticate and route you to the News interface with your filters remembered. If password reset, we'll send a 6-digit code and prompt you to enter it.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm">Active curators</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
              </div>
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