'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { VerificationModal } from './VerificationModal';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  
  // Auto-generated username
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  
  // Availability checks
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });
  const [artistNameStatus, setArtistNameStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Verification modal
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Debounced availability check
  useEffect(() => {
    if (!email) {
      setEmailStatus({ checking: false, available: null });
      return;
    }
    
    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'email', value: email }),
        });
        const data = await res.json();
        setEmailStatus({
          checking: false,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setEmailStatus({ checking: false, available: null });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (!artistName) {
      setArtistNameStatus({ checking: false, available: null });
      return;
    }
    
    const timer = setTimeout(async () => {
      setArtistNameStatus({ checking: true, available: null });
      try {
        const res = await fetch('/api/auth/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'artist', value: artistName }),
        });
        const data = await res.json();
        setArtistNameStatus({
          checking: false,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setArtistNameStatus({ checking: false, available: null });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [artistName]);

  // Generate usernames when artist name changes
  const generateUsernames = useCallback(async () => {
    if (!artistName) return;
    
    const suffixes = ['sub', 'grid', 'void', 'flux', 'prime', 'edge', 'freq', 'rave', 'drift'];
    const normalized = artistName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '.');
    
    const suggestions: string[] = [];
    for (let i = 0; i < 3; i++) {
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const random = Math.random().toString(36).substring(2, 5);
      suggestions.push(`${normalized}.${suffix}${random}`);
    }
    
    setGeneratedUsernames(suggestions);
    setSelectedUsername(suggestions[0]);
  }, [artistName]);

  useEffect(() => {
    if (artistName && artistNameStatus.available) {
      generateUsernames();
    }
  }, [artistName, artistNameStatus.available, generateUsernames]);

  const addSocialLink = () => {
    if (socialLinks.length < 5) {
      setSocialLinks([...socialLinks, '']);
    }
  };

  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = value;
    setSocialLinks(newLinks);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!firstName || !lastName || !artistName || !email || !password || !confirmPassword || !region || !genre) {
      setError('All fields marked with * are required');
      return false;
    }
    
    if (password.length < 10) {
      setError('Password must be at least 10 characters');
      return false;
    }
    
    if (!/[0-9!@#$%^&*]/.test(password)) {
      setError('Password must include a number or symbol');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!emailStatus.available) {
      setError('Email is not available');
      return false;
    }
    
    if (!artistNameStatus.available) {
      setError('Artist name is not available');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const validSocialLinks = socialLinks.filter(link => link.trim() !== '');
      
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          artistName,
          email,
          password,
          confirmPassword,
          region,
          genre,
          socialLinks: validSocialLinks,
        }),
      });
      
      const data = await res.json();
      
      if (!data.ok) {
        setError(data.error || 'Signup failed');
        setIsSubmitting(false);
        return;
      }
      
      // Show verification modal
      setVerificationJobId(data.jobId);
      setShowVerification(true);
      onOpenChange(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
    if (status.checking) {
      return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
    if (status.available === true) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (status.available === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-lime-400/20">
          <DialogHeader>
            <DialogTitle className="text-2xl text-lime-400">Join thecueRoom</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-lime-400">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="lastName" className="text-lime-400">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="artistName" className="text-lime-400">Artist Name *</Label>
              <div className="relative">
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white pr-10"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AvailabilityIndicator status={artistNameStatus} />
                </div>
              </div>
              {artistNameStatus.reason && (
                <p className="text-sm text-red-400 mt-1">{artistNameStatus.reason}</p>
              )}
            </div>
            
            {generatedUsernames.length > 0 && (
              <div>
                <Label className="text-lime-400">Auto-Generated Username</Label>
                <div className="flex gap-2 mt-1">
                  {generatedUsernames.map((username, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedUsername(username)}
                      className={`px-3 py-2 rounded border text-sm ${
                        selectedUsername === username
                          ? 'bg-lime-400/20 border-lime-400 text-lime-400'
                          : 'bg-gray-900 border-gray-700 text-gray-300'
                      }`}
                    >
                      {username}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={generateUsernames}
                    className="px-3 py-2 rounded border border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="email" className="text-lime-400">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white pr-10"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AvailabilityIndicator status={emailStatus} />
                </div>
              </div>
              {emailStatus.reason && (
                <p className="text-sm text-red-400 mt-1">{emailStatus.reason}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="password" className="text-lime-400">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Min 10 characters, must include a number or symbol
              </p>
            </div>
            
            <div>
              <Label htmlFor="confirmPassword" className="text-lime-400">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region" className="text-lime-400">Region *</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  maxLength={60}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g., London, UK"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="genre" className="text-lime-400">Genre *</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  maxLength={120}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="e.g., House, Techno"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label className="text-lime-400">Social Links (Optional, max 5)</Label>
              {socialLinks.map((link, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input
                    value={link}
                    onChange={(e) => updateSocialLink(idx, e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="https://soundcloud.com/yourname"
                  />
                  {idx > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeSocialLink(idx)}
                      className="border-gray-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {socialLinks.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSocialLink}
                  className="mt-2 border-lime-400/50 text-lime-400"
                >
                  + Add Link
                </Button>
              )}
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting || !emailStatus.available || !artistNameStatus.available}
              className="w-full bg-lime-400 text-black hover:bg-lime-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {verificationJobId && (
        <VerificationModal
          open={showVerification}
          onOpenChange={setShowVerification}
          jobId={verificationJobId}
        />
      )}
    </>
  );
}
