'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { generateUsername } from '@/lib/username-generator';
import PasswordStrength from './PasswordStrength';
import VerificationModal from './VerificationModal';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilityStatus {
  email: 'checking' | 'available' | 'taken' | 'idle';
  artistName: 'checking' | 'available' | 'taken' | 'idle';
  username: 'checking' | 'available' | 'taken' | 'idle';
}

const REGIONS = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania', 'Middle East'];
const GENRES = ['House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Hip Hop', 'Pop', 'Rock', 'Electronic', 'Ambient', 'Other'];

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
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

  const [username, setUsername] = useState('');
  const [usernameAlternatives, setUsernameAlternatives] = useState<string[]>([]);
  const [availability, setAvailability] = useState<AvailabilityStatus>({
    email: 'idle',
    artistName: 'idle',
    username: 'idle'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);

  const debouncedEmail = useDebounce(formData.email, 500);
  const debouncedArtistName = useDebounce(formData.artistName, 500);
  const debouncedUsername = useDebounce(username, 500);

  // Check email availability
  useEffect(() => {
    if (debouncedEmail && debouncedEmail.includes('@')) {
      checkAvailability('email', debouncedEmail);
    }
  }, [debouncedEmail]);

  // Check artist name availability
  useEffect(() => {
    if (debouncedArtistName && debouncedArtistName.length >= 2) {
      checkAvailability('artistName', debouncedArtistName);
    }
  }, [debouncedArtistName]);

  // Check username availability
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkAvailability('username', debouncedUsername);
    }
  }, [debouncedUsername]);

  // Generate username when artist name is entered
  useEffect(() => {
    if (formData.artistName && formData.artistName.length >= 2) {
      const generated = generateUsername(formData.artistName);
      setUsername(generated);
      setUsernameAlternatives([]);
    }
  }, [formData.artistName]);

  const checkAvailability = async (field: keyof AvailabilityStatus, value: string) => {
    setAvailability(prev => ({ ...prev, [field]: 'checking' }));

    try {
      const response = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      });

      const data = await response.json();

      if (response.status === 429) {
        setErrors(prev => ({ ...prev, [field]: 'Too many requests. Please wait.' }));
        setAvailability(prev => ({ ...prev, [field]: 'idle' }));
        return;
      }

      setAvailability(prev => ({ ...prev, [field]: data.available ? 'available' : 'taken' }));

      if (!data.available) {
        setErrors(prev => ({ ...prev, [field]: `This ${field} is already taken` }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Availability check failed:', error);
      setAvailability(prev => ({ ...prev, [field]: 'idle' }));
    }
  };

  const regenerateUsername = () => {
    if (!formData.artistName) return;

    const alternatives = Array.from({ length: 3 }, () => generateUsername(formData.artistName));
    setUsernameAlternatives(alternatives);
  };

  const addSocialLink = () => {
    if (formData.socialLinks.length < 5) {
      setFormData(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, '']
      }));
    }
  };

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.artistName) newErrors.artistName = 'Artist name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 10) newErrors.password = 'Password must be at least 10 characters';
    if (!/[0-9!@#$%^&*]/.test(formData.password)) newErrors.password = 'Password must include a number or symbol';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.genre) newErrors.genre = 'Genre is required';
    if (!username) newErrors.username = 'Username is required';

    // Validate social links
    formData.socialLinks.forEach((link, i) => {
      if (link && !link.match(/^https?:\/\/.+/)) {
        newErrors[`socialLink${i}`] = 'Must be a valid URL starting with http:// or https://';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (availability.email !== 'available' || availability.artistName !== 'available' || availability.username !== 'available') {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          username,
          socialLinks: formData.socialLinks.filter(link => link.trim() !== '')
        })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationJobId(data.verificationJobId);
      } else {
        setErrors({ submit: data.message || 'Signup failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    availability.email === 'available' &&
    availability.artistName === 'available' &&
    availability.username === 'available' &&
    formData.firstName &&
    formData.lastName &&
    formData.password.length >= 10 &&
    formData.password === formData.confirmPassword &&
    formData.region &&
    formData.genre;

  if (verificationJobId) {
    return (
      <VerificationModal
        jobId={verificationJobId}
        onComplete={() => {
          onClose();
          window.location.href = '/dashboard';
        }}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0B0B0B] border-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#D7FF3C]">Create Your Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                aria-required="true"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                aria-required="true"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="artistName">Artist Name *</Label>
            <div className="relative">
              <Input
                id="artistName"
                value={formData.artistName}
                onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white pr-10"
                aria-required="true"
              />
              {availability.artistName === 'checking' && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
              {availability.artistName === 'available' && <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
              {availability.artistName === 'taken' && <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />}
            </div>
            {errors.artistName && <p className="text-red-500 text-xs mt-1">{errors.artistName}</p>}
          </div>

          <div>
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white pr-10"
                aria-required="true"
              />
              {availability.username === 'checking' && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
              {availability.username === 'available' && <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
              {availability.username === 'taken' && <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />}
            </div>
            <Button
              type="button"
              onClick={regenerateUsername}
              variant="ghost"
              size="sm"
              className="mt-1 text-xs text-[#D7FF3C] hover:text-[#D7FF3C]/80"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
            {usernameAlternatives.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400">Alternatives:</p>
                {usernameAlternatives.map((alt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setUsername(alt); setUsernameAlternatives([]); }}
                    className="block text-xs text-[#9B5CFF] hover:underline"
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white pr-10"
                aria-required="true"
              />
              {availability.email === 'checking' && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
              {availability.email === 'available' && <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
              {availability.email === 'taken' && <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />}
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              aria-required="true"
            />
            <PasswordStrength password={formData.password} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              aria-required="true"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Region *</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region} className="text-white">{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
            </div>

            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select value={formData.genre} onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {GENRES.map(genre => (
                    <SelectItem key={genre} value={genre} className="text-white">{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.genre && <p className="text-red-500 text-xs mt-1">{errors.genre}</p>}
            </div>
          </div>

          <div>
            <Label>Social Links (0-5)</Label>
            {formData.socialLinks.map((link, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={link}
                  onChange={(e) => updateSocialLink(index, e.target.value)}
                  placeholder="https://soundcloud.com/yourprofile"
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
                />
                <Button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {formData.socialLinks.length < 5 && (
              <Button
                type="button"
                onClick={addSocialLink}
                variant="outline"
                size="sm"
                className="mt-2 border-[#1a1a1a] text-[#D7FF3C] hover:bg-[#1a1a1a]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            )}
          </div>

          {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}