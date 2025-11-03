
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, X, Upload, CheckCircle2 } from 'lucide-react';

const REGIONS = [
  'North America',
  'Europe',
  'Asia',
  'South America',
  'Africa',
  'Oceania',
  'Middle East',
];

const GENRES = [
  'House',
  'Techno',
  'Trance',
  'Drum & Bass',
  'Dubstep',
  'Hip Hop',
  'Pop',
  'Rock',
  'Electronic',
  'Ambient',
  'Other',
];

interface ProfileData {
  user: {
    id: string;
    email: string;
    username: string;
    verified: boolean;
    verificationStatus: string;
    artistName?: string;
  };
  profile: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    phone?: string;
    region?: string;
    genre?: string;
    showEmail: boolean;
    showPhone: boolean;
    publicReleases: boolean;
    allowContactRequests: boolean;
  } | null;
}

export function MyProfileSettings() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    bio: '',
    avatar: '',
    phone: '',
    region: '',
    genre: '',
    showEmail: true,
    showPhone: false,
    publicReleases: true,
    allowContactRequests: true,
  });
  const [originalData, setOriginalData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(true);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data: ProfileData = await response.json();
      setProfileData(data);
      
      const profile = data.profile || {};
      const newFormData = {
        displayName: profile.displayName || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        phone: profile.phone || '',
        region: profile.region || '',
        genre: profile.genre || '',
        showEmail: profile.showEmail ?? true,
        showPhone: profile.showPhone ?? false,
        publicReleases: profile.publicReleases ?? true,
        allowContactRequests: profile.allowContactRequests ?? true,
      };
      
      setFormData(newFormData);
      setOriginalData(newFormData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      setOriginalData(formData);
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setSaveStatus('idle');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implement avatar upload
    console.log('Avatar upload not yet implemented');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0b0b]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF3C]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Saved successfully</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-400">Error saving changes</span>
        )}
      </div>

      {/* Read-only Info */}
      {profileData && (
        <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Email</Label>
              <Input
                value={profileData.user.email}
                disabled
                className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-400">Username</Label>
              <Input
                value={profileData.user.username}
                disabled
                className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed"
              />
            </div>
            {profileData.user.artistName && (
              <div>
                <Label className="text-gray-400">Artist Name</Label>
                <Input
                  value={profileData.user.artistName}
                  disabled
                  className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed"
                />
              </div>
            )}
            <div>
              <Label className="text-gray-400">Verification Status</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={profileData.user.verificationStatus}
                  disabled
                  className="bg-[#1a1a1a] border-[#333] text-gray-500 cursor-not-allowed flex-1 capitalize"
                />
                {profileData.user.verified && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Avatar */}
      <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={formData.avatar} alt="Profile" />
            <AvatarFallback className="bg-[#9B5CFF] text-white text-2xl">
              {(profileData?.user.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload New Picture</span>
              </div>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </Label>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region} className="text-white">
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => setFormData({ ...formData, genre: value })}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre} className="text-white">
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-[#0b0b0b] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showEmail" className="text-base">Show Email Publicly</Label>
              <p className="text-sm text-gray-400">Allow others to see your email address</p>
            </div>
            <Switch
              id="showEmail"
              checked={formData.showEmail}
              onCheckedChange={(checked) => setFormData({ ...formData, showEmail: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showPhone" className="text-base">Show Phone Publicly</Label>
              <p className="text-sm text-gray-400">Allow others to see your phone number</p>
            </div>
            <Switch
              id="showPhone"
              checked={formData.showPhone}
              onCheckedChange={(checked) => setFormData({ ...formData, showPhone: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publicReleases" className="text-base">Public Releases</Label>
              <p className="text-sm text-gray-400">Show your releases on your public profile</p>
            </div>
            <Switch
              id="publicReleases"
              checked={formData.publicReleases}
              onCheckedChange={(checked) => setFormData({ ...formData, publicReleases: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowContactRequests" className="text-base">Allow Contact Requests</Label>
              <p className="text-sm text-gray-400">Let others send you contact requests</p>
            </div>
            <Switch
              id="allowContactRequests"
              checked={formData.allowContactRequests}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, allowContactRequests: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Save/Cancel Buttons */}
      {hasChanges && (
        <div className="flex justify-end gap-3 sticky bottom-6">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-[#1a1a1a]"
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
