'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

interface ProfileSettings {
  bio?: string;
  showEmail: boolean;
  showPhone: boolean;
  publicReleases: boolean;
  allowContactRequests: boolean;
}

interface MyProfileSettingsProps {
  initialSettings: ProfileSettings;
  onSave: (settings: ProfileSettings) => Promise<void>;
}

export function MyProfileSettings({ initialSettings, onSave }: MyProfileSettingsProps) {
  const [settings, setSettings] = useState<ProfileSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      await onSave(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="bg-black border-lime-400/20 p-6">
        <h2 className="text-2xl font-bold text-lime-400 mb-6">Profile Settings</h2>
        
        <div className="space-y-6">
          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-lime-400 mb-2 block">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={settings.bio || ''}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Privacy Settings */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
            <p className="text-sm text-gray-400 mb-4">
              Control who can see your information
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <Label htmlFor="show-email" className="text-white font-medium">
                    Show Email Address
                  </Label>
                  <p className="text-sm text-gray-400">
                    Allow other members to see your email address
                  </p>
                </div>
                <Switch
                  id="show-email"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showEmail: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label htmlFor="show-phone" className="text-white font-medium">
                    Show Phone Number
                  </Label>
                  <p className="text-sm text-gray-400">
                    Allow other members to see your phone number
                  </p>
                </div>
                <Switch
                  id="show-phone"
                  checked={settings.showPhone}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showPhone: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label htmlFor="public-releases" className="text-white font-medium">
                    Public Releases
                  </Label>
                  <p className="text-sm text-gray-400">
                    Show your releases on your public profile
                  </p>
                </div>
                <Switch
                  id="public-releases"
                  checked={settings.publicReleases}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, publicReleases: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <Label htmlFor="contact-requests" className="text-white font-medium">
                    Allow Contact Requests
                  </Label>
                  <p className="text-sm text-gray-400">
                    Let other members send you contact requests
                  </p>
                </div>
                <Switch
                  id="contact-requests"
                  checked={settings.allowContactRequests}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, allowContactRequests: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-lime-400 text-black hover:bg-lime-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            
            {saveStatus === 'success' && (
              <span className="text-lime-400 text-sm">Changes saved successfully!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Failed to save changes</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
