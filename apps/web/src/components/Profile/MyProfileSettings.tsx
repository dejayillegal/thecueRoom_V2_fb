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
import { Loader2, Save, X, Plus, Trash2, Upload, Cpu } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

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
  const [profile, setProfile] = useState<any>({
    artistName: "",
    bio: "",
    region: "",
    genre: "",
    socialLinks: { metadata: {} },
    showEmail: true,
    showPhone: false,
    publicReleases: true,
    allowContactRequests: true,
  });

  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
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

      if (data.profile) {
        const p = data.profile;
        if (!p.socialLinks) p.socialLinks = { metadata: {} };
        if (typeof p.socialLinks === 'string') {
          try {
            p.socialLinks = JSON.parse(p.socialLinks);
          } catch (e) {
            p.socialLinks = { metadata: {} };
          }
        }
        if (!p.socialLinks.metadata) p.socialLinks.metadata = {};
        
        setProfile(p);
        setOriginalProfile(JSON.parse(JSON.stringify(p)));
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const generateDroidAvatar = (seed: string) => {
    const colors = ["#D7FF3C", "#873BBF", "#FF3D7F", "#3DFFCB"];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    return `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#0B0B0B"/>
      <path d="M20 20 L80 20 L80 80 L20 80 Z" stroke="${color}" stroke-width="2" fill="none" opacity="0.3"/>
      <path d="M30 30 L70 30 L70 70 L30 70 Z" stroke="${color}" stroke-width="4" fill="none"/>
      <circle cx="50" cy="50" r="10" fill="${color}" opacity="0.5"/>
      <path d="M10 50 L30 50 M70 50 L90 50 M50 10 L50 30 M50 70 L50 90" stroke="${color}" stroke-width="2"/>
    </svg>`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File too large (max 2MB)");
      return;
    }

    if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
      alert("Only JPG and PNG allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfile((prev: any) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          metadata: {
            ...(prev.socialLinks?.metadata || {}),
            avatarImage: base64,
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDroid = () => {
    const svg = generateDroidAvatar(profile.artistName || "user");
    setProfile((prev: any) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        metadata: {
          ...(prev.socialLinks?.metadata || {}),
          generatedAvatarSvg: svg,
        }
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setOriginalProfile(JSON.parse(JSON.stringify(data.profile)));
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
    setProfile(JSON.parse(JSON.stringify(originalProfile)));
    setSaveStatus("idle");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        {saveStatus === "saved" && <span className="text-sm text-green-400">✓ Saved successfully</span>}
        {saveStatus === "error" && <span className="text-sm text-red-400">Error saving changes</span>}
      </div>

      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <UserAvatar profile={profile} size="lg" />
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg transition-colors border border-[#333]">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Photo</span>
                </div>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </Label>
              <Button
                type="button"
                onClick={handleGenerateDroid}
                variant="outline"
                className="border-[#1a1a1a] bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                <Cpu className="h-4 w-4 mr-2" />
                Generate Droid
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              JPG or PNG. Max 2MB. Seed: {profile.artistName || "username"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={profile.artistName}
              onChange={(e) => setProfile((prev: any) => ({ ...prev, artistName: e.target.value }))}
              className="bg-[#0a0a0a] border-[#1a1a1a] text-white"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((prev: any) => ({ ...prev, bio: e.target.value }))}
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
                onValueChange={(value) => setProfile((prev: any) => ({ ...prev, region: value }))}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue />
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
                value={profile.genre}
                onValueChange={(value) => setProfile((prev: any) => ({ ...prev, genre: value }))}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-[#1a1a1a] text-white">
                  <SelectValue />
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

      <Card className="bg-[#0B0B0B] border-[#1a1a1a] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showEmail" className="text-base">Show Email Publicly</Label>
            </div>
            <Switch
              id="showEmail"
              checked={profile.showEmail}
              onCheckedChange={(checked) => setProfile((prev: any) => ({ ...prev, showEmail: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showPhone" className="text-base">Show Phone Publicly</Label>
            </div>
            <Switch
              id="showPhone"
              checked={profile.showPhone}
              onCheckedChange={(checked) => setProfile((prev: any) => ({ ...prev, showPhone: checked }))}
            />
          </div>
        </div>
      </Card>

      {hasChanges && (
        <div className="flex justify-end gap-3 sticky bottom-6">
          <Button onClick={handleCancel} variant="outline" className="border-[#1a1a1a]" disabled={isSaving}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#D7FF3C] text-black hover:bg-[#D7FF3C]/90 font-semibold">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
