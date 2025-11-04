
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Mail,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { VerificationModal } from "../Auth/VerificationModal";
import { useRouter } from "next/navigation";
import { createVerificationJob } from "@/lib/services/artist-verification";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvailabilityStatus {
  checking: boolean;
  available: boolean | null;
  reason?: string;
}

interface FieldError {
  field: string;
  message: string;
}

const PASSWORD_MIN_LENGTH = 10;

// Password complexity validation
const validatePasswordComplexity = (pwd: string): boolean => {
  if (pwd.length < PASSWORD_MIN_LENGTH) return false;
  
  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd);
  
  return hasUpperCase && hasLowerCase && hasNumberOrSpecial;
};

// Allowed music platform domains
const ALLOWED_MUSIC_PLATFORMS = [
  "soundcloud.com",
  "bandcamp.com",
  "spotify.com",
  "mixcloud.com",
  "beatport.com",
  "youtube.com",
  "instagram.com",
];

// Common regions for artist signups
const REGIONS = [
  { value: "berlin-eu", label: "Berlin, EU" },
  { value: "london-uk", label: "London, UK" },
  { value: "paris-fr", label: "Paris, FR" },
  { value: "amsterdam-nl", label: "Amsterdam, NL" },
  { value: "new-york-us", label: "New York, US" },
  { value: "los-angeles-us", label: "Los Angeles, US" },
  { value: "tokyo-jp", label: "Tokyo, JP" },
  { value: "mumbai-in", label: "Mumbai, IN" },
  { value: "other", label: "Other" },
];

const AvailabilityIndicator = ({ status }: { status: AvailabilityStatus }) => {
  if (status.checking) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-label="Checking availability" />;
  }
  if (status.available === true) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Available" />;
  }
  if (status.available === false) {
    return <XCircle className="h-4 w-4 text-red-500" aria-label="Not available" />;
  }
  return null;
};

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "forgot">("signin");

  // Form state - Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  
  // Artist checkbox state
  const [isArtist, setIsArtist] = useState(false);

  // Artist-only fields
  const [artistName, setArtistName] = useState("");
  const [region, setRegion] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [primaryGenre, setPrimaryGenre] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [musicPlatformLink, setMusicPlatformLink] = useState("");

  // Social links management
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  // Availability status
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });
  const [artistNameStatus, setArtistNameStatus] = useState<AvailabilityStatus>({
    checking: false,
    available: null,
  });

  // Verification state
  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Reset form when modal closes or tab changes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    setError("");
    setSuccess("");
    setFieldErrors([]);
  }, [activeTab]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setBio("");
    setIsArtist(false);
    setArtistName("");
    setRegion("");
    setCustomRegion("");
    setPrimaryGenre("");
    setPublicProfileUrl("");
    setMusicPlatformLink("");
    setSocialLinks([""]);
    setEmailStatus({ checking: false, available: null });
    setArtistNameStatus({ checking: false, available: null });
    setError("");
    setSuccess("");
    setFieldErrors([]);
    setIsLoading(false);
    setIsSubmitting(false);
    setActiveTab("signin");
    setVerificationJobId(null);
    setShowVerification(false);
  };

  // Debounced availability check for email
  useEffect(() => {
    if (!email || activeTab !== "signup") {
      setEmailStatus({ checking: false, available: null });
      return;
    }

    const timer = setTimeout(async () => {
      setEmailStatus({ checking: true, available: null });
      try {
        const res = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "email", value: email }),
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
    }, 400);

    return () => clearTimeout(timer);
  }, [email, activeTab]);

  // Debounced availability check for artist name
  useEffect(() => {
    if (!artistName || !isArtist || activeTab !== "signup") {
      setArtistNameStatus({ checking: false, available: null });
      return;
    }

    const timer = setTimeout(async () => {
      setArtistNameStatus({ checking: true, available: null });
      try {
        const res = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "artist", value: artistName }),
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
    }, 400);

    return () => clearTimeout(timer);
  }, [artistName, isArtist, activeTab]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must include at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must include at least one lowercase letter";
    }
    if (!/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)) {
      return "Password must include a number or special character";
    }
    if (!validatePasswordComplexity(pwd)) {
      return "Password does not meet complexity requirements";
    }
    return null;
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateMusicPlatformUrl = (url: string): boolean => {
    if (!validateUrl(url)) return false;
    try {
      const urlObj = new URL(url);
      return ALLOWED_MUSIC_PLATFORMS.some((domain) =>
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  };

  const addSocialLink = () => {
    if (socialLinks.length < 5) {
      setSocialLinks([...socialLinks, ""]);
    }
  };

  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = value;
    setSocialLinks(newLinks);
  };

  const removeSocialLink = (index: number) => {
    if (socialLinks.length > 1) {
      setSocialLinks(socialLinks.filter((_, i) => i !== index));
    } else {
      setSocialLinks([""]);
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldError[] = [];

    // Common fields validation
    if (!displayName || displayName.trim().length < 2) {
      errors.push({ field: "displayName", message: "Display name must be at least 2 characters" });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: "email", message: "Please enter a valid email address" });
    }

    if (!emailStatus.available) {
      errors.push({ field: "email", message: "Email is not available" });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.push({ field: "password", message: passwordError });
    }

    if (password !== confirmPassword) {
      errors.push({ field: "confirmPassword", message: "Passwords do not match" });
    }

    // Artist-specific validation
    if (isArtist) {
      if (!artistName || artistName.trim().length < 2) {
        errors.push({ field: "artistName", message: "Artist name must be at least 2 characters" });
      }

      // Check for emoji-only or blank artist names
      const emojiRegex = /^[\p{Emoji}\s]+$/u;
      if (artistName && emojiRegex.test(artistName)) {
        errors.push({ field: "artistName", message: "Artist name cannot contain only emojis" });
      }

      if (!artistNameStatus.available) {
        errors.push({ field: "artistName", message: "Artist name is not available" });
      }

      if (!region) {
        errors.push({ field: "region", message: "Please select a region" });
      }

      if (region === "other" && !customRegion.trim()) {
        errors.push({ field: "customRegion", message: "Please specify your region" });
      }

      if (!primaryGenre || primaryGenre.trim().length < 2) {
        errors.push({ field: "primaryGenre", message: "Please enter your primary genre" });
      }

      if (!publicProfileUrl || !validateUrl(publicProfileUrl)) {
        errors.push({ field: "publicProfileUrl", message: "Please enter a valid public profile URL" });
      }

      if (!musicPlatformLink || !validateMusicPlatformUrl(musicPlatformLink)) {
        errors.push({
          field: "musicPlatformLink",
          message: "Please enter a valid music platform link (SoundCloud, Spotify, Bandcamp, etc.)",
        });
      }

      // Validate social links
      const validSocialLinks = socialLinks.filter((link) => link.trim() !== "");
      for (let i = 0; i < validSocialLinks.length; i++) {
        if (!validateUrl(validSocialLinks[i])) {
          errors.push({ field: `socialLink${i}`, message: `Social link ${i + 1} is not a valid URL` });
        }
      }
    }

    setFieldErrors(errors);
    if (errors.length > 0) {
      setError(errors[0].message);
      return false;
    }

    setError("");
    return true;
  };

  const getFieldError = (field: string): string | undefined => {
    return fieldErrors.find((e) => e.field === field)?.message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError("Please enter email and password");
        return;
      }

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }

      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors([]);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const validSocialLinks = socialLinks.filter((link) => link.trim() !== "");

      const payload: any = {
        display_name: displayName,
        bio: bio || null,
        email,
        password,
        is_artist: isArtist,
      };

      if (isArtist) {
        payload.artist_name = artistName;
        payload.region = region === "other" ? customRegion : region;
        payload.primary_genre = primaryGenre;
        payload.public_profile_url = publicProfileUrl;
        payload.music_platform_link = musicPlatformLink;
        payload.social_links = validSocialLinks;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setError(data.error || "Signup failed");
        setIsSubmitting(false);
        return;
      }

      // Show verification modal if artist
      if (isArtist && data.jobId) {
        setVerificationJobId(data.jobId);
        setShowVerification(true);
        setSuccess("Verification in progress — you'll be notified once approved.");
      } else {
        setSuccess("Account created successfully!");
        setTimeout(() => {
          onClose();
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!email) {
        setError("Please enter your email address");
        return;
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      setSuccess("Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthContinue = (provider: string) => {
    console.log(`OAuth with ${provider} - Coming soon`);
    setError(`${provider} authentication coming soon`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-[820px] bg-black border border-[#2a2a2a] text-white p-0 gap-0 overflow-hidden max-h-[90vh]"
          aria-describedby="signup-modal-description"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              {activeTab === "signin"
                ? "Sign In"
                : activeTab === "signup"
                  ? "Sign Up"
                  : "Forgot Password"}
            </DialogTitle>
          </DialogHeader>
          <div id="signup-modal-description" className="sr-only">
            {activeTab === "signup" 
              ? "Sign up for a new account. Check the Artist checkbox to sign up as an artist or DJ."
              : activeTab === "signin"
              ? "Sign in to your existing account"
              : "Reset your password"}
          </div>
          <div className="grid grid-cols-[1fr_340px]">
            {/* Left Column - Auth Forms */}
            <div className="p-8 overflow-y-auto max-h-[85vh]">
              {/* Header with Tabs */}
              <h2 className="text-xl font-semibold mb-6">
                {activeTab === "signin"
                  ? "Sign In"
                  : activeTab === "signup"
                    ? "Sign Up"
                    : "Forgot Password"}
              </h2>
              <div className="flex gap-1 mb-8" role="tablist">
                <button
                  onClick={() => setActiveTab("signin")}
                  role="tab"
                  aria-selected={activeTab === "signin"}
                  aria-controls="signin-panel"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "signin"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  role="tab"
                  aria-selected={activeTab === "signup"}
                  aria-controls="signup-panel"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "signup"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab("forgot")}
                  role="tab"
                  aria-selected={activeTab === "forgot"}
                  aria-controls="forgot-panel"
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "forgot"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  Forgot
                </button>
              </div>

              {/* Sign In Form */}
              {activeTab === "signin" && (
                <div role="tabpanel" id="signin-panel" aria-labelledby="signin-tab">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-sm text-gray-400">
                        Email
                      </Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm text-gray-400">
                        Password
                      </Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Use a strong password.</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="text-white hover:text-[#D7FF3C] font-medium"
                        disabled={isLoading}
                      >
                        Forgot Password
                      </button>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400" role="alert">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sign Up Form */}
              {activeTab === "signup" && (
                <div role="tabpanel" id="signup-panel" aria-labelledby="signup-tab">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {/* Artist Checkbox - Moved to top for visibility */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#D7FF3C]/30 transition-colors">
                        <Checkbox
                          id="artist-checkbox"
                          checked={isArtist}
                          onCheckedChange={(checked) => setIsArtist(checked === true)}
                          className="w-5 h-5"
                          aria-describedby="artist-checkbox-description"
                        />
                        <Label
                          htmlFor="artist-checkbox"
                          className="text-white cursor-pointer text-sm font-medium flex-1"
                        >
                          Sign up as Artist / DJ
                        </Label>
                      </div>
                      <p id="artist-checkbox-description" className="text-xs text-gray-500 px-4">
                        Check this if you're an artist or DJ. Additional verification fields will appear.
                      </p>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm text-gray-400">
                        Display Name *
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        required
                        aria-required="true"
                        aria-invalid={!!getFieldError("displayName")}
                        aria-describedby={getFieldError("displayName") ? "displayName-error" : undefined}
                      />
                      {getFieldError("displayName") && (
                        <p id="displayName-error" className="text-xs text-red-400" role="alert">
                          {getFieldError("displayName")}
                        </p>
                      )}
                    </div>

                    {/* Bio (optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm text-gray-400">
                        Bio (optional)
                      </Label>
                      <Input
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      />
                    </div>

                    {/* Artist-only fields section */}
                    {isArtist && (
                      <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-[#D7FF3C]" />
                          <p className="text-sm text-[#D7FF3C] font-medium">
                            Artist Details (for verification)
                          </p>
                        </div>

                        {/* Artist Name */}
                        <div className="space-y-2">
                          <Label htmlFor="artistName" className="text-sm text-gray-400">
                            Artist Name *
                          </Label>
                          <div className="relative">
                            <Input
                              id="artistName"
                              value={artistName}
                              onChange={(e) => setArtistName(e.target.value)}
                              placeholder="e.g. Dotslash, Brutal Frequencies, or DJ Alias"
                              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] pr-10"
                              required={isArtist}
                              aria-required={isArtist}
                              aria-invalid={!!getFieldError("artistName")}
                              aria-describedby={getFieldError("artistName") ? "artistName-error" : "artistName-status"}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2" id="artistName-status">
                              <AvailabilityIndicator status={artistNameStatus} />
                            </div>
                          </div>
                          {artistNameStatus.reason && (
                            <p className="text-xs text-red-400" role="alert">
                              {artistNameStatus.reason}
                            </p>
                          )}
                          {getFieldError("artistName") && (
                            <p id="artistName-error" className="text-xs text-red-400" role="alert">
                              {getFieldError("artistName")}
                            </p>
                          )}
                        </div>

                        {/* Region */}
                        <div className="space-y-2">
                          <Label htmlFor="region" className="text-sm text-gray-400">
                            Region *
                          </Label>
                          <Select value={region} onValueChange={setRegion} required={isArtist}>
                            <SelectTrigger
                              id="region"
                              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                              aria-invalid={!!getFieldError("region")}
                              aria-describedby={getFieldError("region") ? "region-error" : undefined}
                            >
                              <SelectValue placeholder="Select region — e.g., Berlin, EU" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-[#2a2a2a] text-white">
                              {REGIONS.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getFieldError("region") && (
                            <p id="region-error" className="text-xs text-red-400" role="alert">
                              {getFieldError("region")}
                            </p>
                          )}
                        </div>

                        {/* Custom Region (if "Other" selected) */}
                        {region === "other" && (
                          <div className="space-y-2">
                            <Label htmlFor="customRegion" className="text-sm text-gray-400">
                              Specify Region *
                            </Label>
                            <Input
                              id="customRegion"
                              value={customRegion}
                              onChange={(e) => setCustomRegion(e.target.value)}
                              placeholder="e.g. São Paulo, BR"
                              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                              required={region === "other"}
                              aria-required={region === "other"}
                              aria-invalid={!!getFieldError("customRegion")}
                              aria-describedby={getFieldError("customRegion") ? "customRegion-error" : undefined}
                            />
                            {getFieldError("customRegion") && (
                              <p id="customRegion-error" className="text-xs text-red-400" role="alert">
                                {getFieldError("customRegion")}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Primary Genre */}
                        <div className="space-y-2">
                          <Label htmlFor="primaryGenre" className="text-sm text-gray-400">
                            Primary Genre *
                          </Label>
                          <Input
                            id="primaryGenre"
                            value={primaryGenre}
                            onChange={(e) => setPrimaryGenre(e.target.value)}
                            placeholder="e.g. Techno, House"
                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                            required={isArtist}
                            aria-required={isArtist}
                            aria-invalid={!!getFieldError("primaryGenre")}
                            aria-describedby={getFieldError("primaryGenre") ? "primaryGenre-error" : undefined}
                          />
                          {getFieldError("primaryGenre") && (
                            <p id="primaryGenre-error" className="text-xs text-red-400" role="alert">
                              {getFieldError("primaryGenre")}
                            </p>
                          )}
                        </div>

                        {/* Public Profile URL */}
                        <div className="space-y-2">
                          <Label htmlFor="publicProfileUrl" className="text-sm text-gray-400">
                            Public Profile URL *
                          </Label>
                          <Input
                            id="publicProfileUrl"
                            type="url"
                            value={publicProfileUrl}
                            onChange={(e) => setPublicProfileUrl(e.target.value)}
                            placeholder="https://soundcloud.com/yourname"
                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                            required={isArtist}
                            aria-required={isArtist}
                            aria-invalid={!!getFieldError("publicProfileUrl")}
                            aria-describedby="publicProfileUrl-help"
                          />
                          <p id="publicProfileUrl-help" className="text-xs text-gray-500">
                            This will be verified by AI to prevent fake or duplicate accounts.
                          </p>
                          {getFieldError("publicProfileUrl") && (
                            <p className="text-xs text-red-400" role="alert">
                              {getFieldError("publicProfileUrl")}
                            </p>
                          )}
                        </div>

                        {/* Required Music Platform Link */}
                        <div className="space-y-2">
                          <Label htmlFor="musicPlatformLink" className="text-sm text-gray-400">
                            Required Music Platform Link *
                          </Label>
                          <Input
                            id="musicPlatformLink"
                            type="url"
                            value={musicPlatformLink}
                            onChange={(e) => setMusicPlatformLink(e.target.value)}
                            placeholder="https://soundcloud.com/yourname or https://open.spotify.com/artist/..."
                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                            required={isArtist}
                            aria-required={isArtist}
                            aria-invalid={!!getFieldError("musicPlatformLink")}
                            aria-describedby="musicPlatformLink-help"
                          />
                          <p id="musicPlatformLink-help" className="text-xs text-gray-500">
                            Supported: SoundCloud, Spotify, Bandcamp, Mixcloud, Beatport, YouTube Music
                          </p>
                          {getFieldError("musicPlatformLink") && (
                            <p className="text-xs text-red-400" role="alert">
                              {getFieldError("musicPlatformLink")}
                            </p>
                          )}
                        </div>

                        {/* Social Links */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-400">
                            Social Links (up to 5)
                          </Label>
                          <div className="space-y-2">
                            {socialLinks.map((link, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  type="url"
                                  value={link}
                                  onChange={(e) => updateSocialLink(index, e.target.value)}
                                  placeholder={`https://instagram.com/yourname`}
                                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                                  aria-label={`Social link ${index + 1}`}
                                  aria-invalid={!!getFieldError(`socialLink${index}`)}
                                  aria-describedby={getFieldError(`socialLink${index}`) ? `socialLink${index}-error` : undefined}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => removeSocialLink(index)}
                                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-3"
                                  aria-label={`Remove social link ${index + 1}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          {socialLinks.length < 5 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addSocialLink}
                              className="w-full border-[#2a2a2a] bg-transparent text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                              aria-label="Add another social link"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Link ({socialLinks.length}/5)
                            </Button>
                          )}
                          <p className="text-xs text-gray-500">
                            Add links to your social profiles (Instagram, Twitter, etc.)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm text-gray-400">
                        Email *
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] pr-10"
                          required
                          aria-required="true"
                          aria-invalid={!!getFieldError("email")}
                          aria-describedby={getFieldError("email") ? "email-error" : "email-status"}
                          autoComplete="email"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2" id="email-status">
                          <AvailabilityIndicator status={emailStatus} />
                        </div>
                      </div>
                      {emailStatus.reason && (
                        <p className="text-xs text-red-400" role="alert">
                          {emailStatus.reason}
                        </p>
                      )}
                      {getFieldError("email") && (
                        <p id="email-error" className="text-xs text-red-400" role="alert">
                          {getFieldError("email")}
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm text-gray-400">
                          Password *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                          required
                          aria-required="true"
                          aria-invalid={!!getFieldError("password")}
                          aria-describedby={getFieldError("password") ? "password-error" : "password-help"}
                          autoComplete="new-password"
                        />
                        <p id="password-help" className="text-xs text-gray-500">
                          Min 10 chars with number or symbol
                        </p>
                        {getFieldError("password") && (
                          <p id="password-error" className="text-xs text-red-400" role="alert">
                            {getFieldError("password")}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm text-gray-400">
                          Confirm Password *
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••••"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                          required
                          aria-required="true"
                          aria-invalid={!!getFieldError("confirmPassword")}
                          aria-describedby={getFieldError("confirmPassword") ? "confirmPassword-error" : undefined}
                          autoComplete="new-password"
                        />
                        {getFieldError("confirmPassword") && (
                          <p id="confirmPassword-error" className="text-xs text-red-400" role="alert">
                            {getFieldError("confirmPassword")}
                          </p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400" role="alert">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400" role="alert">
                        {success}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !emailStatus.available || (isArtist && !artistNameStatus.available)}
                        className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isArtist ? "Creating Artist Account..." : "Creating Account..."}
                          </>
                        ) : (
                          isArtist ? "Sign Up as Artist" : "Sign Up"
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Forgot Password Form */}
              {activeTab === "forgot" && (
                <div role="tabpanel" id="forgot-panel" aria-labelledby="forgot-tab">
                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-sm text-gray-400">
                        Email
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400" role="alert">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400" role="alert">
                        {success}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column - Welcome Panel */}
            <div className="bg-[#0a0a0a] border-l border-[#2a2a2a] p-8">
              <h2 className="text-xl font-semibold mb-4">Welcome to thecueRoom</h2>
              <p className="text-sm text-gray-400 mb-6">
                Invite-first platform. Approved members get access to the gated dashboard.
              </p>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">Reduced motion respected.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">WCAG AA contrast on dark.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">Scam-free, AI-verified community.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">
                    Access sections: Cover Art, Memes, News, Gigs.
                  </span>
                </li>
              </ul>

              <div className="mt-8 pt-6 border-t border-[#2a2a2a] text-xs text-gray-500">
                By continuing you agree to our Terms and Privacy.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {verificationJobId && (
        <VerificationModal
          open={showVerification}
          onOpenChange={setShowVerification}
          jobId={verificationJobId}
          onComplete={() => {
            setShowVerification(false);
            router.push("/dashboard");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
