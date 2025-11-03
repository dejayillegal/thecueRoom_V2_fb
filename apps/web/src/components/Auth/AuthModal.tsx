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
  ArrowRight,
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
        <DialogContent className="max-w-[600px] bg-black border border-[#2a2a2a] text-white p-0 gap-0 overflow-hidden max-h-[90vh] rounded-2xl">
          <DialogTitle className="sr-only">
            {activeTab === "signin"
              ? "Sign In"
              : activeTab === "signup"
                ? "Sign Up"
                : "Forgot Password"}
          </DialogTitle>

          {/* Header with Logo and Tabs */}
          <div className="px-8 pt-8 pb-6 border-b border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D7FF3C] rounded-lg"></div>
                <span className="text-xl font-semibold">thecueRoom</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("signin")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "signin"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "signup"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab("forgot")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "forgot"
                      ? "bg-[#D7FF3C] text-black"
                      : "bg-transparent text-gray-400 hover:text-white border border-[#2a2a2a]"
                  }`}
                >
                  Forgot
                </button>
              </div>
            </div>
          </div>

          {/* Form Content - Two Column Layout for Desktop */}
          <div className="flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Main Form Column */}
            <div className="flex-1">
            {/* Sign In Form */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-6">
                <p className="text-gray-400 text-base mb-6">
                  Welcome back. Enter your credentials to continue.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm text-gray-400">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@artist.com"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-14 text-base rounded-2xl px-4"
                    disabled={isLoading}
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
                    placeholder="••••••••"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-14 text-base rounded-2xl px-4"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-14 px-8 rounded-2xl text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-14 px-8 rounded-2xl text-base"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("forgot")}
                  className="text-sm text-gray-400 hover:text-white mt-4"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Create your {isArtist ? "artist " : ""}account
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Join thecueRoom community
                  </p>
                </div>

                {/* Artist Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="artist-checkbox"
                      checked={isArtist}
                      onChange={(e) => setIsArtist(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-[#2a2a2a] bg-[#0a0a0a] text-[#D7FF3C] focus:ring-[#D7FF3C] focus:ring-offset-0 cursor-pointer"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="artist-checkbox"
                        className="text-white cursor-pointer text-sm font-medium block mb-1"
                      >
                        Sign up as Artist / DJ
                      </Label>
                      <p className="text-xs text-gray-500">
                        Additional verification fields will appear for artist accounts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm text-gray-300 font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 text-base focus:border-[#D7FF3C] rounded-lg px-4"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm text-gray-300 font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Rivera"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 text-base focus:border-[#D7FF3C] rounded-lg px-4"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {isArtist && (
                  <div className="space-y-2">
                    <Label htmlFor="artistName" className="text-sm text-gray-300 font-medium">
                      Artist Name *
                    </Label>
                    <p className="text-xs text-gray-500 mb-1">Your stage name</p>
                    <div className="relative">
                      <Input
                        id="artistName"
                        value={artistName}
                        onChange={(e) => setArtistName(e.target.value)}
                        placeholder="Your stage name"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] pr-10 rounded-lg px-4"
                        disabled={isLoading}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {artistAvailability.checking && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {!artistAvailability.checking &&
                          artistAvailability.available === true && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        {!artistAvailability.checking &&
                          artistAvailability.available === false && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                      </div>
                    </div>
                    {artistAvailability.reason && (
                      <p className="text-xs text-red-400">{artistAvailability.reason}</p>
                    )}
                    {generatedUsername && (
                      <p className="text-xs text-gray-400">
                        Username: <span className="text-[#D7FF3C]">{generatedUsername}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-300 font-medium">
                    Email *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] pr-10 rounded-lg px-4"
                      disabled={isLoading}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailAvailability.checking && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {!emailAvailability.checking &&
                        emailAvailability.available === true && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      {!emailAvailability.checking &&
                        emailAvailability.available === false && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                  </div>
                  {emailAvailability.reason && (
                    <p className="text-xs text-red-400">{emailAvailability.reason}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-gray-300 font-medium">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] rounded-lg px-4"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm text-gray-300 font-medium">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] rounded-lg px-4"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {password && strength && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Password strength:</span>
                      <span className="text-gray-300 capitalize">{strength.level}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Min 10 chars, must include letter + number + symbol
                    </p>
                  </div>
                )}

                {isArtist && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryGenre" className="text-sm text-gray-300 font-medium">
                          Primary Genre *
                        </Label>
                        <Input
                          id="primaryGenre"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          placeholder="Techno"
                          maxLength={120}
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] rounded-lg px-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cityRegion" className="text-sm text-gray-300 font-medium">
                          City / Region *
                        </Label>
                        <Input
                          id="cityRegion"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="Berlin, DE"
                          maxLength={60}
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] rounded-lg px-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio" className="text-sm text-gray-300 font-medium">
                        Portfolio / Music Links *
                      </Label>
                      <Input
                        id="portfolio"
                        type="url"
                        value={publicProfileUrl}
                        onChange={(e) => setPublicProfileUrl(e.target.value)}
                        placeholder="SoundCloud / Spotify / EPK"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-12 focus:border-[#D7FF3C] rounded-lg px-4"
                        disabled={isLoading}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        SoundCloud, Spotify, Bandcamp, Mixcloud, Beatport, or YouTube profile URL
                      </p>
                    </div>
                  </>
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
                  <Label htmlFor="agree-terms" className="text-xs text-gray-400 cursor-pointer">
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
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      !emailAvailability.available ||
                      (isArtist && !artistAvailability.available) ||
                      !agreeTerms ||
                      (isArtist && !publicProfileUrl)
                    }
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-12 px-8 rounded-full disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        {isArtist ? "Create Artist Account" : "Create Account"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-12 px-8 rounded-2xl"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <p className="text-gray-400 text-base mb-6">
                  Enter your email to receive a password reset link.
                </p>

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
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-14 text-base rounded-2xl px-4"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                    {success}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-14 px-8 rounded-2xl text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-5 w-5" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-14 px-8 rounded-2xl text-base"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}
            </div>

            {/* Right Rail - Desktop Only */}
            {activeTab === "signup" && (
              <div className="hidden lg:block lg:w-80 space-y-6">
                {/* What's Next Card */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">What's next</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    After signing up, you'll be able to:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]">
                      Artist
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]">
                      Techno
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]">
                      House
                    </span>
                  </div>
                </div>

                {/* Verification Steps Card */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Verification steps</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D7FF3C] text-black font-semibold flex items-center justify-center text-xs">
                        1
                      </span>
                      <span className="text-gray-300">Email confirmation</span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 font-semibold flex items-center justify-center text-xs">
                        2
                      </span>
                      <span className="text-gray-400">Link your music profiles</span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 font-semibold flex items-center justify-center text-xs">
                        3
                      </span>
                      <span className="text-gray-400">Get access</span>
                    </li>
                  </ol>
                </div>

                {/* Community Card */}
                <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-3">Community</h3>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-300 font-medium mb-1">
                        Tips: Better EPKs
                      </p>
                      <p className="text-xs text-gray-500">
                        AI EPK Generator
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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