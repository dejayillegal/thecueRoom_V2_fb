
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Loader2, RefreshCw, UserPlus, Mail, Lock, User, MapPin, Music, Link as LinkIcon } from 'lucide-react';
import { useDebounce } from '@/src/hooks/use-debounce';
import { generateUsername } from '@/src/lib/username-generator';
import VerificationModal from '@/src/components/Auth/VerificationModal';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilityState {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

const PASSWORD_MIN_LENGTH = 10;

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [activeTab, setActiveTab] = useState('signup');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    artistName: '',
    email: '',
    password: '',
    confirmPassword: '',
    region: '',
    genre: '',
    profileUrl: '',
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

  const debouncedArtistName = useDebounce(formData.artistName, 400);
  const debouncedEmail = useDebounce(formData.email, 400);
  const debouncedUsername = useDebounce(autoUsername, 400);

  // Auto-save to localStorage every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.values(formData).some(v => Array.isArray(v) ? v.some(s => s) : v)) {
        localStorage.setItem('signup-draft', JSON.stringify(formData));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [formData]);

  // Restore draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('signup-draft');
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to restore draft:', e);
      }
    }
  }, []);

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

  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= PASSWORD_MIN_LENGTH) strength += 25;
    if (password.length >= 15) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password)) strength += 25;
    return strength;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Required';
    if (!formData.artistName.trim()) newErrors.artistName = 'Required';
    if (!formData.email.trim()) newErrors.email = 'Required';
    else if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.region.trim()) newErrors.region = 'Required';
    if (!formData.genre.trim()) newErrors.genre = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!availability.artistName.available || !availability.email.available || !availability.username.available) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          artistName: formData.artistName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          username: autoUsername,
          region: formData.region.trim(),
          genre: formData.genre.trim(),
          profileUrl: formData.profileUrl.trim() || undefined,
          socialLinks: formData.socialLinks.filter(link => link.trim())
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem('signup-draft');
        setVerificationJobId(data.jobId);
        setShowVerificationModal(true);
      } else {
        setErrors({ submit: data.error || 'Signup failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    availability.artistName.available &&
    availability.email.available &&
    availability.username.available &&
    formData.firstName &&
    formData.lastName &&
    formData.password.length >= PASSWORD_MIN_LENGTH &&
    formData.password === formData.confirmPassword &&
    formData.region &&
    formData.genre;

  const AvailabilityIndicator = ({ state }: { state: AvailabilityState }) => {
    if (state.checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-live="polite" aria-label="Checking availability" />;
    }
    if (state.available === true) {
      return <Check className="h-4 w-4 text-green-500" aria-label="Available" />;
    }
    if (state.available === false) {
      return <X className="h-4 w-4 text-red-500" aria-label="Not available" />;
    }
    return null;
  };

  if (verificationJobId && showVerificationModal) {
    return (
      <VerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        jobId={verificationJobId}
        onComplete={() => {
          setShowVerificationModal(false);
          onClose();
          window.location.href = '/dashboard';
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0B0B0B] border border-[#1a1a1a] text-white p-0">
        <div className="sticky top-0 z-10 bg-[#0B0B0B] border-b border-[#1a1a1a] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] bg-clip-text text-transparent">
              Join thecueRoom
            </DialogTitle>
          </DialogHeader>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6 py-4">
          <TabsList className="grid w-full grid-cols-3 bg-[#0a0a0a] mb-6">
            <TabsTrigger value="signin" className="data-[state=active]:bg-[#1a1a1a]">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-[#1a1a1a]">Sign Up</TabsTrigger>
            <TabsTrigger value="forgot" className="data-[state=active]:bg-[#1a1a1a]">Forgot</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#D7FF3C] flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                      aria-invalid={!!errors.firstName}
                    />
                    {errors.firstName && <p className="text-red-400 text-xs" role="alert">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                      aria-invalid={!!errors.lastName}
                    />
                    {errors.lastName && <p className="text-red-400 text-xs" role="alert">{errors.lastName}</p>}
                  </div>
                </div>
              </div>

              {/* Artist Profile */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9B5CFF] flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Artist Profile
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist / Project Name *</Label>
                  <div className="relative">
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a] pr-10"
                      aria-required="true"
                      aria-describedby="artistName-status"
                    />
                    <div className="absolute right-3 top-3" id="artistName-status">
                      <AvailabilityIndicator state={availability.artistName} />
                    </div>
                  </div>
                  {availability.artistName.reason && (
                    <p className="text-red-400 text-xs" role="alert">{availability.artistName.reason}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoUsername">Auto-generated Username</Label>
                  <div className="relative">
                    <Input
                      id="autoUsername"
                      value={autoUsername}
                      readOnly
                      className="bg-[#0a0a0a] border-[#1a1a1a] pr-10"
                      aria-describedby="username-status"
                    />
                    <div className="absolute right-3 top-3" id="username-status">
                      <AvailabilityIndicator state={availability.username} />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={regenerateUsername}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#9B5CFF] hover:text-[#9B5CFF]/80 h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                  {showAlternatives && usernameAlternatives.length > 0 && (
                    <div className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md space-y-2">
                      <p className="text-xs text-gray-400">Alternatives:</p>
                      <div className="flex flex-wrap gap-2">
                        {usernameAlternatives.map((alt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => { setAutoUsername(alt); setShowAlternatives(false); }}
                            className="px-3 py-1 text-xs bg-[#9B5CFF]/10 hover:bg-[#9B5CFF]/20 text-[#9B5CFF] border border-[#9B5CFF]/30 rounded-full"
                          >
                            {alt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region" className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Region *
                    </Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                      placeholder="e.g. EU — Berlin"
                      maxLength={60}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                    />
                    {errors.region && <p className="text-red-400 text-xs" role="alert">{errors.region}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">Primary Genre *</Label>
                    <Input
                      id="genre"
                      value={formData.genre}
                      onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder="e.g. Techno, Minimal"
                      maxLength={120}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                    />
                    {errors.genre && <p className="text-red-400 text-xs" role="alert">{errors.genre}</p>}
                  </div>
                </div>
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#D7FF3C] flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Account Security
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a] pr-10"
                      aria-required="true"
                      aria-describedby="email-status"
                    />
                    <div className="absolute right-3 top-3" id="email-status">
                      <AvailabilityIndicator state={availability.email} />
                    </div>
                  </div>
                  {availability.email.reason && (
                    <p className="text-red-400 text-xs" role="alert">{availability.email.reason}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                    />
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              getPasswordStrength(formData.password) < 50 ? 'bg-red-500' :
                              getPasswordStrength(formData.password) < 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${getPasswordStrength(formData.password)}%` }}
                            role="progressbar"
                            aria-valuenow={getPasswordStrength(formData.password)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                        <p className="text-xs text-gray-400">Min {PASSWORD_MIN_LENGTH} chars, 1 number/symbol</p>
                      </div>
                    )}
                    {errors.password && <p className="text-red-400 text-xs" role="alert">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                      aria-required="true"
                    />
                    {errors.confirmPassword && <p className="text-red-400 text-xs" role="alert">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Social Links (0-5)
                  </Label>
                  {formData.socialLinks.length < 5 && (
                    <Button
                      type="button"
                      onClick={addSocialLink}
                      variant="outline"
                      size="sm"
                      className="h-7 border-[#1a1a1a] text-[#D7FF3C]"
                    >
                      Add Link
                    </Button>
                  )}
                </div>
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => updateSocialLink(index, e.target.value)}
                      placeholder="https://soundcloud.com/yourprofile"
                      className="bg-[#0a0a0a] border-[#1a1a1a]"
                    />
                    {formData.socialLinks.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        aria-label="Remove link"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-500">SoundCloud, Bandcamp, Instagram, Mixcloud, Spotify</p>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md" role="alert">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#D7FF3C] to-[#9B5CFF] text-black hover:opacity-90 font-semibold h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="border-[#1a1a1a] h-11"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signin">
            <p className="text-center text-gray-400 py-8">Sign in tab (existing functionality)</p>
          </TabsContent>

          <TabsContent value="forgot">
            <p className="text-center text-gray-400 py-8">Forgot password tab (existing functionality)</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
