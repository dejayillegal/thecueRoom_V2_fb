"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAvailability } from "@/src/hooks/use-availability";
import { generateUsername } from "@/src/lib/username-generator";
import VerificationModal from "./VerificationModal";
import InfoModal from "@/components/InfoModal";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = "signin" | "signup" | "forgot";

const PASSWORD_MIN_LENGTH = 8;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signin");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sign up additional fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Generated username
  const [generatedUsername, setGeneratedUsername] = useState("");

  // Availability checks
  const emailAvailability = useAvailability("email", email);
  const artistAvailability = useAvailability("artist", artistName);
  const usernameAvailability = useAvailability("username", generatedUsername);

  // Verification state
  const [verificationJobId, setVerificationJobId] = useState<string | null>(
    null,
  );
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState<
    "terms" | "privacy" | null
  >(null);

  // Reset form when modal closes or tab changes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [activeTab]);

  // Generate username when artist name changes
  useEffect(() => {
    if (artistName && artistAvailability.available) {
      setGeneratedUsername(generateUsername(artistName));
    }
  }, [artistName, artistAvailability.available]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setIsArtist(false);
    setArtistName("");
    setRegion("");
    setGenre("");
    setPublicProfileUrl("");
    setSocialLinks([""]);
    setAgreeTerms(false);
    setError("");
    setSuccess("");
    setIsLoading(false);
    setActiveTab("signin");
    setVerificationJobId(null);
    setShowVerificationModal(false);
    setGeneratedUsername("");
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/[0-9!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)) {
      return "Password must include a number or special character";
    }
    return null;
  };

  const getPasswordStrength = (
    pwd: string,
  ): { level: string; color: string; width: string } => {
    if (!pwd) return { level: "", color: "bg-gray-700", width: "0%" };

    let score = 0;
    // Length scoring
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(pwd)) score += 1;

    // Scoring thresholds
    if (score <= 2) {
      return { level: "Bad", color: "bg-red-500", width: "33%" };
    } else if (score <= 4) {
      return { level: "Weak", color: "bg-yellow-500", width: "66%" };
    } else {
      return { level: "Strong", color: "bg-green-500", width: "100%" };
    }
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
    setIsLoading(true);

    try {
      // Validation - base fields always required
      if (!email || !password || !firstName || !lastName) {
        setError("Please fill in all required fields");
        return;
      }

      // Artist-specific validation
      if (isArtist) {
        if (!artistName || !region || !genre || !publicProfileUrl) {
          setError("Please fill in all required artist fields");
          return;
        }

        // Validate profile URL format
        if (
          !publicProfileUrl.startsWith("http://") &&
          !publicProfileUrl.startsWith("https://")
        ) {
          setError(
            "Public profile URL must be a valid URL (starting with http:// or https://)",
          );
          return;
        }

        // Validate allowed domains for public profile URL
        const allowedDomains = [
          "soundcloud.com",
          "bandcamp.com",
          "spotify.com",
          "mixcloud.com",
          "residentadvisor.net",
          "beatport.com",
          "instagram.com",
          "youtube.com",
        ];

        const profileUrlObj = new URL(publicProfileUrl);
        const isAllowedDomain = allowedDomains.some((domain) =>
          profileUrlObj.hostname.includes(domain),
        );

        if (!isAllowedDomain) {
          setError(
            "Public profile URL must be from a recognized music platform (SoundCloud, Bandcamp, Spotify, etc.)",
          );
          return;
        }
      }

      if (!agreeTerms) {
        setError("You must agree to the Terms and Privacy Policy");
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (!emailAvailability.available) {
        setError("Email is not available");
        return;
      }

      if (isArtist && !artistAvailability.available) {
        setError("Artist name is not available");
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          isArtist,
          ...(isArtist && {
            artistName,
            username: generatedUsername,
            region,
            genre,
            profileUrl: publicProfileUrl,
            socialLinks: socialLinks.filter((link) => link.trim() !== ""),
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Show verification modal with AI verification progress
      setVerificationJobId(data.jobId);
      setShowVerificationModal(true);
      onClose();
    } catch (err) {
      console.error("Sign up error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const strength = password ? getPasswordStrength(password) : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[920px] bg-black border border-[#2a2a2a] text-white p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col rounded-none">
          <DialogTitle className="sr-only">
            {activeTab === "signin"
              ? "Sign In"
              : activeTab === "signup"
                ? "Sign Up"
                : "Forgot Password"}
          </DialogTitle>
          <div className="grid md:grid-cols-[1fr_360px] overflow-hidden flex-1">
            {/* Left Column - Auth Forms */}
            <div className="p-8 overflow-y-auto scrollbar-thin max-h-[calc(90vh-2rem)]">
              {/* Header */}
              <h2 className="text-2xl font-bold mb-6 text-[#D7FF3C]">
                Welcome to thecueRoom
              </h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 border-b border-[#2a2a2a]">
                <button
                  onClick={() => setActiveTab("signin")}
                  className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                    activeTab === "signin"
                      ? "text-[#D7FF3C] bg-[#1a1a1a]"
                      : "text-gray-400 hover:text-white hover:bg-[#0a0a0a]"
                  }`}
                >
                  Sign In
                  {activeTab === "signin" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D7FF3C]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                    activeTab === "signup"
                      ? "text-[#D7FF3C] bg-[#1a1a1a]"
                      : "text-gray-400 hover:text-white hover:bg-[#0a0a0a]"
                  }`}
                >
                  Sign Up
                  {activeTab === "signup" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D7FF3C]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("forgot")}
                  className={`px-6 py-3 text-sm font-semibold transition-all relative ${
                    activeTab === "forgot"
                      ? "text-[#D7FF3C] bg-[#1a1a1a]"
                      : "text-gray-400 hover:text-white hover:bg-[#0a0a0a]"
                  }`}
                >
                  Forgot Password
                  {activeTab === "forgot" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D7FF3C]"></span>
                  )}
                </button>
              </div>

              {/* Sign In Form */}
              {activeTab === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-email"
                      className="text-sm text-gray-400"
                    >
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="signin-password"
                      className="text-sm text-gray-400"
                    >
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
                    />
                  </div>

                  <div className="flex items-center justify-end text-sm">
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
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Artist Checkbox - Prominently placed at top */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#D7FF3C]/30 transition-colors">
                      <input
                        type="checkbox"
                        id="artist-checkbox"
                        checked={isArtist}
                        onChange={(e) => setIsArtist(e.target.checked)}
                        className="w-5 h-5 rounded border-[#2a2a2a] bg-[#0a0a0a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0 cursor-pointer"
                        aria-describedby="artist-checkbox-description"
                        disabled={isLoading}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        First Name *
                      </Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-14 text-base focus:border-[#D7FF3C] rounded-lg px-4"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Last Name *
                      </Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Rivera"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-14 text-base focus:border-[#D7FF3C] rounded-lg px-4"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {isArtist && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Artist / Project Name *
                      </Label>
                      <div className="relative">
                        <Input
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="e.g. Midnight Echo"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] pr-10"
                          disabled={isLoading}
                          required
                        />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {artistAvailability.checking && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!artistAvailability.checking &&
                          artistAvailability.available === true && (
                            <CheckCircle2
                              className="h-4 w-4 text-green-500"
                              aria-label="Available"
                            />
                          )}
                        {!artistAvailability.checking &&
                          artistAvailability.available === false && (
                            <XCircle
                              className="h-4 w-4 text-red-500"
                              aria-label="Taken"
                            />
                          )}
                      </div>
                    </div>
                    {artistAvailability.reason && (
                      <p className="text-xs text-red-400" role="alert">
                        {artistAvailability.reason}
                      </p>
                    )}
                    {generatedUsername && (
                        <p className="text-xs text-gray-400">
                          Username:{" "}
                          <span className="text-[#D7FF3C]">
                            {generatedUsername}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm text-gray-400">Email *</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. alex@example.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] pr-10"
                        disabled={isLoading}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailAvailability.checking && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!emailAvailability.checking &&
                          emailAvailability.available === true && (
                            <CheckCircle2
                              className="h-4 w-4 text-green-500"
                              aria-label="Available"
                            />
                          )}
                        {!emailAvailability.checking &&
                          emailAvailability.available === false && (
                            <XCircle
                              className="h-4 w-4 text-red-500"
                              aria-label="Taken"
                            />
                          )}
                      </div>
                    </div>
                    {emailAvailability.reason && (
                      <p className="text-xs text-red-400" role="alert">
                        {emailAvailability.reason}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Password *
                      </Label>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="e.g. Strong@Pass123"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Confirm Password *
                      </Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="e.g. Strong@Pass123"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {password && strength && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Password strength:
                        </span>
                        <span className="text-gray-300 capitalize">
                          {strength.level}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: strength.width }}
                          role="progressbar"
                          aria-valuenow={parseInt(strength.width)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Min 10 chars, must include letter + number + symbol
                      </p>
                    </div>
                  )}

                  {password &&
                    confirmPassword &&
                    password !== confirmPassword && (
                      <div className="flex items-center gap-2 text-xs text-red-400">
                        <XCircle className="h-3 w-3" />
                        <span>Passwords do not match</span>
                      </div>
                    )}

                  {isArtist && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-400">Region *</Label>
                        <Input
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="e.g. Berlin, EU"
                          maxLength={60}
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-400">
                          Primary Genre *
                        </Label>
                        <Input
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          placeholder="e.g. Techno, House"
                          maxLength={120}
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {isArtist && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Public Profile URL *
                      </Label>
                    <Input
                      type="url"
                      value={publicProfileUrl}
                      onChange={(e) => setPublicProfileUrl(e.target.value)}
                      placeholder="https://soundcloud.com/yourname"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                      disabled={isLoading}
                      required
                    />
                    <p className="text-xs text-gray-500">
                        Required music platform link. Will be verified by AI to
                        prevent fake/duplicate accounts.
                      </p>
                    </div>
                  )}

                  {isArtist && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">
                        Social Links (Max 5)
                      </Label>
                    {socialLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          type="url"
                          value={link}
                          onChange={(e) =>
                            updateSocialLink(idx, e.target.value)
                          }
                          placeholder="https://..."
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C]"
                          disabled={isLoading}
                        />
                        {idx > 0 && (
                          <Button
                            type="button"
                            onClick={() => removeSocialLink(idx)}
                            variant="outline"
                            className="border-[#2a2a2a] text-gray-400 hover:bg-[#1a1a1a]"
                            disabled={isLoading}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    {socialLinks.length < 5 && (
                      <Button
                        type="button"
                        onClick={addSocialLink}
                        variant="outline"
                        className="border-[#2a2a2a] text-gray-400 hover:bg-[#1a1a1a]"
                        disabled={isLoading}
                      >
                        + Add Link
                      </Button>
                    )}
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="agree-terms"
                      className="text-xs text-gray-400 cursor-pointer"
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowInfoModal("terms")}
                        className="text-[#D7FF3C] hover:underline"
                      >
                        Terms
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setShowInfoModal("privacy")}
                        className="text-[#D7FF3C] hover:underline"
                      >
                        Privacy Policy
                      </button>{" "}
                      *
                    </Label>
                  </div>

                  {error && (
                    <div
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        !emailAvailability.available ||
                        (isArtist && !artistAvailability.available) ||
                        !agreeTerms ||
                        (isArtist && !publicProfileUrl)
                      }
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Continue
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {/* Forgot Password Form */}
              {activeTab === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="forgot-email"
                      className="text-sm text-gray-400"
                    >
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
                    />
                  </div>

                  {error && (
                    <div
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400"
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400">
                      {success}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11 px-8"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] h-11 px-8"
                      disabled={isLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column - Welcome Panel */}
            <div className="hidden md:block bg-[#0a0a0a] border-l border-[#2a2a2a] p-8 overflow-y-auto scrollbar-thin">
              <h2 className="text-xl font-semibold mb-4 text-[#D7FF3C]">
                Welcome to thecueRoom
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Invite-first platform. Approved members get access to the gated
                dashboard.
              </p>

              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">
                    Reduced motion respected.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">
                    WCAG AA contrast on dark.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D7FF3C] mt-1">■</span>
                  <span className="text-gray-300">
                    Scam-free, AI-verified community.
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
          open={showVerificationModal}
          onOpenChange={setShowVerificationModal}
          jobId={verificationJobId}
          onComplete={() => {
            setShowVerificationModal(false);
            router.push("/dashboard");
            router.refresh();
          }}
        />
      )}

      {showInfoModal && (
        <InfoModal
          type={showInfoModal}
          onClose={() => setShowInfoModal(null)}
        />
      )}
    </>
  );
}