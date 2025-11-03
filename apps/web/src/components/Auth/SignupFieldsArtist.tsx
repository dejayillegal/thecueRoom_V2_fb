"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface SignupFieldsArtistProps {
  socialProfileUrl: string;
  setSocialProfileUrl: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  additionalSocialLinks: string[];
  setAdditionalSocialLinks: (links: string[]) => void;
}

const ALLOWED_DOMAINS = [
  "soundcloud.com",
  "bandcamp.com",
  "mixcloud.com",
  "spotify.com",
  "youtube.com",
  "beatport.com",
  "instagram.com",
];

export function SignupFieldsArtist({
  socialProfileUrl,
  setSocialProfileUrl,
  genre,
  setGenre,
  additionalSocialLinks,
  setAdditionalSocialLinks,
}: SignupFieldsArtistProps) {
  const addSocialLink = () => {
    if (additionalSocialLinks.length < 4) {
      setAdditionalSocialLinks([...additionalSocialLinks, ""]);
    }
  };

  const removeSocialLink = (index: number) => {
    setAdditionalSocialLinks(
      additionalSocialLinks.filter((_, i) => i !== index),
    );
  };

  const updateSocialLink = (index: number, value: string) => {
    const updated = [...additionalSocialLinks];
    updated[index] = value;
    setAdditionalSocialLinks(updated);
  };

  const validateSocialUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return ALLOWED_DOMAINS.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const isValidPrimaryUrl = validateSocialUrl(socialProfileUrl);

  return (
    <div
      className="space-y-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg"
      role="group"
      aria-labelledby="artist-fields-legend"
    >
      <legend id="artist-fields-legend" className="sr-only">
        Artist profile fields
      </legend>

      <div className="space-y-2">
        <Label htmlFor="socialProfileUrl" className="text-[#D7FF3C]">
          Primary Social Profile URL *
        </Label>
        <Input
          id="socialProfileUrl"
          type="url"
          value={socialProfileUrl}
          onChange={(e) => setSocialProfileUrl(e.target.value)}
          placeholder="https://soundcloud.com/yourname"
          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
          required
          aria-required="true"
        />
        <p className="text-xs text-gray-400">
          Required: SoundCloud, Bandcamp, Mixcloud, Spotify, YouTube, Beatport,
          or Instagram
        </p>
        {socialProfileUrl && !isValidPrimaryUrl && (
          <p className="text-xs text-red-400">
            Invalid URL. Must be from an allowed music platform.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="genre" className="text-[#D7FF3C]">
          Primary Genre *
        </Label>
        <Input
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="e.g., Techno, House"
          maxLength={120}
          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
          required
          aria-required="true"
        />
        <p className="text-xs text-gray-400">
          Enter your primary genre(s), comma-separated (max 120 characters)
        </p>
      </div>

      {additionalSocialLinks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[#D7FF3C]">
            Additional Social Links (Optional)
          </Label>
          {additionalSocialLinks.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="url"
                value={link}
                onChange={(e) => updateSocialLink(index, e.target.value)}
                placeholder="https://instagram.com/yourname"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeSocialLink(index)}
                className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 w-11"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {additionalSocialLinks.length < 4 && (
        <Button
          type="button"
          variant="outline"
          onClick={addSocialLink}
          className="w-full border-[#D7FF3C]/30 text-[#D7FF3C] hover:bg-[#D7FF3C]/10"
        >
          + Add Another Social Link (max 5 total)
        </Button>
      )}

      <div className="space-y-2">
        <Label className="text-[#D7FF3C]">Tech Rider</Label>
        <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center">
          <p className="text-sm text-gray-400">
            Tech rider upload coming soon. You can add this later from your
            profile.
          </p>
        </div>
      </div>
    </div>
  );
}
