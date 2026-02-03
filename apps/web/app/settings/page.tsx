'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { User, Music, Globe, Bell, Lock, Shield, Loader2, Save, CheckCircle2, Wand2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateDeterministicAvatar } from '@/lib/artist-identity';

interface UserProfile {
  user: {
    id: string;
    email: string;
    username: string;
    verified: boolean;
    verificationStatus: string;
    role: string;
  };
  profile: {
    displayName?: string;
    artistName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
    avatarType?: string;
    avatarSeed?: string;
    phone?: string;
    region?: string;
    genre?: string;
    socialLinks?: Record<string, string>;
    socialProfileUrl?: string;
    aiCredits?: number;
    showEmail?: boolean;
    showPhone?: boolean;
    publicReleases?: boolean;
    allowContactRequests?: boolean;
  } | null;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    artistName: '',
    avatarUrl: '',
    avatarType: 'generated',
    avatarSeed: '',
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    region: '',
    genre: '',
    showEmail: false,
    showPhone: false,
    publicReleases: true,
    allowContactRequests: true,
  });

  const [avatarPreview, setAvatarPreview] = useState('');

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const generateNewAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatar = generateDeterministicAvatar(newSeed);
    setAvatarPreview(newAvatar);
    setFormData(prev => ({ 
      ...prev, 
      avatarSeed: newSeed, 
      avatarType: 'generated'
    }));
    setSaved(false);
  };

  const revertAvatar = () => {
    if (userProfile?.user) {
      const originalSeed = userProfile.user.id;
      const originalAvatar = generateDeterministicAvatar(originalSeed);
      setAvatarPreview(originalAvatar);
      setFormData(prev => ({ 
        ...prev, 
        avatarSeed: originalSeed, 
        avatarType: 'generated',
        avatarUrl: ''
      }));
      setSaved(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not logged in, redirect to home
          console.error('User not authenticated, redirecting to home');
          window.location.href = '/';
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data: UserProfile = await response.json();
      setUserProfile(data);

      // Populate form with profile data
      if (data.profile) {
        const profile = data.profile;
        const seed = profile.avatarSeed || data.user.id;
        setFormData({
          displayName: profile.displayName || '',
          artistName: profile.artistName || '',
          avatarUrl: profile.avatarUrl || '',
          avatarType: profile.avatarType || 'generated',
          avatarSeed: seed,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          region: profile.region || '',
          genre: profile.genre || '',
          showEmail: profile.showEmail ?? false,
          showPhone: profile.showPhone ?? false,
          publicReleases: profile.publicReleases ?? true,
          allowContactRequests: profile.allowContactRequests ?? true,
        });
        
        if (profile.avatarType === 'custom' && profile.avatarUrl) {
          setAvatarPreview(profile.avatarUrl);
        } else {
          setAvatarPreview(generateDeterministicAvatar(seed));
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSaved(false);

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh profile data
      await fetchProfile();
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'avatarUrl') {
        if (value) {
          newData.avatarType = 'custom';
          setAvatarPreview(value);
        } else {
          newData.avatarType = 'generated';
          setAvatarPreview(generateDeterministicAvatar(prev.avatarSeed || userProfile?.user.id || 'default'));
        }
      }
      return newData;
    });
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
              <p className="text-gray-400">Manage your account information and preferences</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 h-10 px-6 gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Account Information - READ ONLY */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield size={20} />
                  Account Information
                  {userProfile?.user.verified && (
                    <CheckCircle2 className="w-5 h-5 text-green-500 ml-2" />
                  )}
                  {userProfile?.user.role === 'admin' && (
                    <span className="ml-2 px-2 py-1 text-xs bg-[#D7FF3C] text-black rounded font-semibold">
                      ADMIN
                    </span>
                  )}
                </CardTitle>
                <CardDescription>View your account details (read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input 
                    value={userProfile?.user.email || ''}
                    disabled
                    className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Username</Label>
                  <Input 
                    value={userProfile?.user.username || ''}
                    disabled
                    className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artistName" className="text-gray-300">Artist Name</Label>
                  <Input 
                    id="artistName"
                    value={formData.artistName}
                    onChange={(e) => handleFieldChange('artistName', e.target.value)}
                    placeholder="Your artist name"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-500">This is your public display name.</p>
                </div>
                <div className="space-y-4">
                  <Label className="text-gray-300">Profile Avatar</Label>
                  <div className="flex flex-col items-center gap-6 p-6 bg-[#1a1a1a] border border-[#333] rounded-lg">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-[#D7FF3C] shadow-[0_0_20px_rgba(215,255,60,0.2)] bg-[#050505] relative">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 font-mono text-xs">
                            NO_SIGNAL
                          </div>
                        )}
                        <div className="absolute inset-0 pointer-events-none border border-[#D7FF3C]/20 rounded-lg animate-pulse" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg pointer-events-none">
                        <Wand2 size={24} className="text-[#D7FF3C]" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <label className="cursor-pointer bg-[#D7FF3C] hover:bg-[#D7FF3C]/90 text-black px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors">
                        Upload Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("File size must be less than 2MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const base64 = reader.result as string;
                                setAvatarPreview(base64);
                                setFormData(prev => ({
                                  ...prev,
                                  avatarUrl: base64,
                                  avatarType: 'custom'
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            avatarUrl: '',
                            avatarType: 'generated'
                          }));
                          setAvatarPreview(generateDeterministicAvatar(formData.avatarSeed || userProfile?.user.id || 'default'));
                        }}
                        className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-tighter"
                      >
                        Remove Custom Avatar
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full text-center">
                    <h3 className="text-[#D7FF3C] font-mono text-[10px] uppercase tracking-[0.2em]">Droid Model Configuration</h3>
                    <p className="text-zinc-500 text-[10px] font-mono uppercase">Unit: {formData.avatarSeed || 'NATIVE-CORE'}</p>
                  </div>

                  <div className="flex gap-3 w-full">
                    <Button 
                      onClick={generateNewAvatar}
                      variant="outline"
                      className="flex-1 bg-transparent border-white/10 hover:border-[#D7FF3C]/50 hover:bg-[#D7FF3C]/5 text-white gap-2 font-bold uppercase text-[10px] tracking-widest"
                    >
                      <Wand2 size={14} />
                      Reconfigure Droid
                    </Button>
                    <Button 
                      onClick={revertAvatar}
                      variant="ghost"
                      className="text-zinc-500 hover:text-white gap-2 font-bold uppercase text-[10px] tracking-widest"
                    >
                      <RotateCcw size={14} />
                      Reset Core
                    </Button>
                  </div>
                </div>

                <div className="hidden">
                  <Label htmlFor="avatarUrl" className="text-gray-300">Custom Avatar URL</Label>
                  <Input 
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={(e) => handleFieldChange('avatarUrl', e.target.value)}
                    placeholder="https://..."
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                  <p className="text-xs text-gray-500 italic">Overwrite generated avatar with a custom image link</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Verification Status</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={userProfile?.user.verificationStatus || 'pending'}
                      disabled
                      className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed flex-1 capitalize"
                    />
                    {userProfile?.user.verified && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Account Role</Label>
                  <Input 
                    value={userProfile?.user.role || 'user'}
                    disabled
                    className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed uppercase"
                  />
                </div>
                {userProfile?.profile?.socialProfileUrl && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Verified Social Profile</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={userProfile.profile.socialProfileUrl}
                        disabled
                        className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed flex-1"
                      />
                      {userProfile.user.verified && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Verified social links cannot be changed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Information - EDITABLE */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User size={20} />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
                  <Input 
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleFieldChange('displayName', e.target.value)}
                    placeholder="How you want to be displayed"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                    <Input 
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      placeholder="First name"
                      className="bg-[#1a1a1a] border-[#333] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                    <Input 
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      placeholder="Last name"
                      className="bg-[#1a1a1a] border-[#333] text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                  <Textarea 
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="bg-[#1a1a1a] border-[#333] text-white resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Music Profile - EDITABLE */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Music size={20} />
                  Music Profile
                </CardTitle>
                <CardDescription>Update your music-related information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-gray-300">Region</Label>
                  <Input 
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleFieldChange('region', e.target.value)}
                    placeholder="e.g., New York, London, Tokyo"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genre" className="text-gray-300">Genre</Label>
                  <Input 
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => handleFieldChange('genre', e.target.value)}
                    placeholder="e.g., Techno, House, Drum & Bass"
                    className="bg-[#1a1a1a] border-[#333] text-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings - EDITABLE */}
            <Card className="bg-[#111] border-[#222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe size={20} />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control what information is publicly visible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Show Email Publicly</Label>
                    <p className="text-sm text-gray-500">Display your email on your profile</p>
                  </div>
                  <Switch 
                    checked={formData.showEmail}
                    onCheckedChange={(checked) => handleFieldChange('showEmail', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Show Phone Publicly</Label>
                    <p className="text-sm text-gray-500">Display your phone number on your profile</p>
                  </div>
                  <Switch 
                    checked={formData.showPhone}
                    onCheckedChange={(checked) => handleFieldChange('showPhone', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Public Releases</Label>
                    <p className="text-sm text-gray-500">Make your music releases public</p>
                  </div>
                  <Switch 
                    checked={formData.publicReleases}
                    onCheckedChange={(checked) => handleFieldChange('publicReleases', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Allow Contact Requests</Label>
                    <p className="text-sm text-gray-500">Let others send you messages</p>
                  </div>
                  <Switch 
                    checked={formData.allowContactRequests}
                    onCheckedChange={(checked) => handleFieldChange('allowContactRequests', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Credits Display */}
            {userProfile?.profile?.aiCredits !== undefined && (
              <Card className="bg-[#111] border-[#222]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    AI Credits
                  </CardTitle>
                  <CardDescription>Your available AI generation credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#D7FF3C]">
                    {userProfile.profile.aiCredits}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Use credits for AI Cover Art, EPK generation, and more
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
    </div>
  );
}
