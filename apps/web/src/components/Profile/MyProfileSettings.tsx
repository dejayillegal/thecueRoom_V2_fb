"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, X, Plus, Trash2, Upload } from "lucide-react";

const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "South America",
  "Africa",
  "Oceania",
  "Middle East",
];
const GENRES = [
  "House",
  "Techno",
  "Trance",
  "Drum & Bass",
  "Dubstep",
  "Hip Hop",
  "Pop",
  "Rock",
  "Electronic",
  "Ambient",
  "Other",
];

export default function MyProfileSettings() {
  const [profile, setProfile] = useState({
    artistName: "",
    bio: "",
    avatar: "",
    region: "",
    genre: "",
    socialLinks: [""],
    showEmail: true,
    showPhone: false,
    publicReleases: true,
    allowContactRequests: true,
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasChanges(changed);
  }, [profile, originalProfile]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile/me");
      const data = await response.json();

      if (data.ok) {
        setProfile(data.profile);
        setOriginalProfile(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          socialLinks: profile.socialLinks.filter((link) => link.trim() !== ""),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalProfile(data.profile);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setSaveStatus("idle");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => ({ ...prev, avatar: data.avatarUrl }));
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    }
  };

  const addSocialLink = () => {
    if (profile.socialLinks.length < 5) {
      setProfile((prev) => ({
        ...prev,
        socialLinks: [...prev.socialLinks, ""],
      }));
    }
  };

  const removeSocialLink = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const updateSocialLink = (index: number, value: string) => {
    setProfile((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) =>
        i === index ? value : link,
      ),
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        {saveStatus === "saved" && (
          <span className="text-sm text-green-400">✓ Saved successfully</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-400">Error saving changes</span>
        )}
      </div>

      {/* Avatar Section */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Profile Picture
        </h2>
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar} alt={profile.artistName} />
            <AvatarFallback className="bg-[#9B5CFF] text-white text-2xl">
              {profile.artistName.charAt(0).toUpperCase()}
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
            <p className="text-xs text-gray-400 mt-2">
              JPG, PNG or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </Card>

      {/* Basic Info */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Basic Information
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={profile.artistName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, artistName: e.target.value }))
              }
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              rows={4}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="region">Region</Label>
              <Select
                value={profile.region}
                onValueChange={(value) =>
                  setProfile((prev) => ({ ...prev, region: value }))
                }
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {REGIONS.map((region) => (
                    <SelectItem
                      key={region}
                      value={region}
                      className="text-white"
                    >
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={profile.genre}
                onValueChange={(value) =>
                  setProfile((prev) => ({ ...prev, genre: value }))
                }
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#1a1a1a]">
                  {GENRES.map((genre) => (
                    <SelectItem
                      key={genre}
                      value={genre}
                      className="text-white"
                    >
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
        <div className="space-y-3">
          {profile.socialLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
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
          {profile.socialLinks.length < 5 && (
            <Button
              type="button"
              onClick={addSocialLink}
              variant="outline"
              size="sm"
              className="border-[#1a1a1a] text-[#D7FF3C] hover:bg-[#1a1a1a]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Link
            </Button>
          )}
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Privacy Settings
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showEmail" className="text-base">
                Show Email Publicly
              </Label>
              <p className="text-sm text-gray-400">
                Allow others to see your email address
              </p>
            </div>
            <Switch
              id="showEmail"
              checked={profile.showEmail}
              onCheckedChange={(checked) =>
                setProfile((prev) => ({ ...prev, showEmail: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showPhone" className="text-base">
                Show Phone Publicly
              </Label>
              <p className="text-sm text-gray-400">
                Allow others to see your phone number
              </p>
            </div>
            <Switch
              id="showPhone"
              checked={profile.showPhone}
              onCheckedChange={(checked) =>
                setProfile((prev) => ({ ...prev, showPhone: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publicReleases" className="text-base">
                Public Releases
              </Label>
              <p className="text-sm text-gray-400">
                Show your releases on your public profile
              </p>
            </div>
            <Switch
              id="publicReleases"
              checked={profile.publicReleases}
              onCheckedChange={(checked) =>
                setProfile((prev) => ({ ...prev, publicReleases: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowContactRequests" className="text-base">
                Allow Contact Requests
              </Label>
              <p className="text-sm text-gray-400">
                Let others send you contact requests
              </p>
            </div>
            <Switch
              id="allowContactRequests"
              checked={profile.allowContactRequests}
              onCheckedChange={(checked) =>
                setProfile((prev) => ({
                  ...prev,
                  allowContactRequests: checked,
                }))
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
