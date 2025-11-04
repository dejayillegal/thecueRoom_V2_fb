"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Lock,
  Music,
  MapPin,
  Link as LinkIcon,
  User,
} from "lucide-react";
import { generateUsername } from "@/src/lib/username-generator";
import VerificationModal from "./VerificationModal";
import InfoModal from "@/components/InfoModal";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useToast } from "@/src/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = "signin" | "signup" | "forgot";

const PASSWORD_MIN_LENGTH = 8;

// Define the shape of the availability result
interface AvailabilityResult {
  available: boolean | null;
  checking: boolean;
  reason?: string | null;
}

// Custom hook for checking availability
export function useAvailability(
  type: "email" | "artist" | "username",
  value: string,
  debounceMs: number = 400,
): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    available: null,
    checking: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(
    async (val: string) => {
      if (!val || val.trim() === '') {
        setResult({ available: null, checking: false });
        return;
      }

      setResult({ available: null, checking: true });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: val.trim() }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Attempt to parse JSON, fallback to empty object
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResult({
          available: data.available,
          checking: false,
          reason: data.reason || null,
        });
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
          return; // Ignore abort errors
        }
        console.error("Availability check error:", error);
        setResult({
          available: false,
          checking: false,
          reason: error.message || "An unknown error occurred",
        });
      } finally {
        // Clean up the abort controller and timeout
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    [type], // Dependency array includes 'type'
  );

  useEffect(() => {
    // Debounce the availability check
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      checkAvailability(value);
    }, debounceMs);

    // Cleanup function to clear timeout and abort ongoing fetch
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, debounceMs, checkAvailability]); // Include checkAvailability in dependencies

  return result;
}


export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { toast } = useToast();
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
  const [agreeTerms] = useState(true);

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
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please enter both email and password",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.toast) {
          toast({
            variant: data.toast.variant || "destructive",
            title: data.toast.title,
            description: data.toast.description,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign In Failed",
            description: data.error || "Invalid email or password",
          });
        }
        setError(data.error || "Invalid email or password");
        return;
      }

      if (data.toast) {
        toast({
          title: data.toast.title,
          description: data.toast.description,
        });
      }

      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Sign in error:", err);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
      });
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
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields",
        });
        setIsLoading(false);
        return;
      }

      // Artist-specific validation
      if (isArtist) {
        if (!artistName || !region || !genre || !publicProfileUrl) {
          toast({
            variant: "destructive",
            title: "Missing Artist Information",
            description: "Please fill in all required artist fields",
          });
          setIsLoading(false);
          return;
        }

        // Validate profile URL format
        if (
          !publicProfileUrl.startsWith("http://") &&
          !publicProfileUrl.startsWith("https://")
        ) {
          toast({
            variant: "destructive",
            title: "Invalid URL",
            description: "Public profile URL must start with http:// or https://",
          });
          setIsLoading(false);
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
          toast({
            variant: "destructive",
            title: "Invalid Platform",
            description: "Please use a recognized music platform URL",
          });
          setIsLoading(false);
          return;
        }
      }

      if (!agreeTerms) {
        toast({
          variant: "destructive",
          title: "Terms Required",
          description: "You must agree to the Terms and Privacy Policy",
        });
        setIsLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        toast({
          variant: "destructive",
          title: "Weak Password",
          description: passwordError,
        });
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Password Mismatch",
          description: "Passwords do not match",
        });
        setIsLoading(false);
        return;
      }

      if (!emailAvailability.available) {
        toast({
          variant: "destructive",
          title: "Email Unavailable",
          description: "This email is already registered",
        });
        setIsLoading(false);
        return;
      }

      if (isArtist && !artistAvailability.available) {
        toast({
          variant: "destructive",
          title: "Artist Name Taken",
          description: "This artist name is already in use",
        });
        setIsLoading(false);
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
        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: data.error || "Failed to create account",
        });
        setError(data.error || "Failed to create account");
        return;
      }

      toast({
        title: isArtist ? "Artist Account Created!" : "Account Created!",
        description: isArtist 
          ? "Your profile is being verified. This usually takes a few moments."
          : "Welcome to thecueRoom!",
      });

      // Show verification modal with AI verification progress
      setVerificationJobId(data.jobId);
      setShowVerificationModal(true);
      onClose();
    } catch (err) {
      console.error("Sign up error:", err);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
      });
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
        toast({
          variant: "destructive",
          title: "Email Required",
          description: "Please enter your email address",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: data.error || "Failed to send reset email",
        });
        setError(data.error || "Failed to send reset email");
        return;
      }

      toast({
        title: "Email Sent!",
        description: "Check your inbox for password reset instructions.",
      });
      setSuccess("Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
      });
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
        <DialogContent className="max-w-[600px] bg-black border border-[#2a2a2a] text-white p-0 gap-0 max-h-[90vh] rounded-2xl flex flex-col">
          <DialogTitle className="sr-only">
            {activeTab === "signin"
              ? "Sign In"
              : activeTab === "signup"
                ? "Sign Up"
                : "Forgot Password"}
          </DialogTitle>

          {/* Header with Logo and Tabs */}
          <div className="px-6 pt-6 pb-4 border-b border-[#2a2a2a]">
            <div className="flex items-end gap-2 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1000 1000"
                aria-label="thecueRoom logo icon"
                className="w-8 h-8"
                fill="#D7FF3C"
              >
                <style>
                  {`
                    #blinkPath {
                      transform-box: fill-box;
                      transform-origin: 50% 50%;
                      animation: blink 10s 2s infinite;
                    }
                    @keyframes blink {
                      0%, 92%, 100% { transform: none; opacity: 1; }
                      94% { transform: scaleY(.14); opacity: .85; }
                      96% { transform: none; opacity: 1; }
                    }

                    @media (prefers-reduced-motion: reduce) {
                      #blinkPath { 
                        animation: none; 
                      }
                    }
                  `}
                </style>
                <g className="logo-g-wrapper">
                  <g transform="translate(150, 150) scale(0.8)">
                    <g id="path-1">
                      <path
                        d="M0 0 C6.96680886 6.58190229 11.20844039 13.65367903 11.55859375 23.37890625 C11.30936167 32.83888919 7.46815214 40.08780125 1.12109375 47.00390625 C-5.94764579 53.3672115 -12.89475479 56.69746301 -22.51953125 56.41015625 C-34.08188846 55.0119177 -44.36926826 49.46378088 -54.56640625 44.19433594 C-87.12810684 27.43221051 -120.73014096 18.37179144 -156.87890625 13.00390625 C-157.7807666 12.86968262 -158.68262695 12.73545898 -159.61181641 12.59716797 C-184.65703241 9.08283038 -211.86319397 9.55754983 -236.87890625 13.00390625 C-237.79752441 13.12749512 -238.71614258 13.25108398 -239.66259776 13.37841797 C-299.12399187 21.6606483 -357.24472951 45.88651713 -402.8046875 85.3671875 C-405.55628196 87.74881968 -408.39436735 90.00260014 -411.25390625 92.25390625 C-421.29347646 100.42393772 -430.69590368 109.97255002 -438.87890625 120.00390625 C-439.29140625 120.5026123 -439.70390625 121.00131836 -440.12890625 121.51513672 C-451.96938292 135.85938085 -462.65646624 150.84727181 -471.87890625 167.00390625 C-472.30526367 167.73915527 -472.73162109 168.4744043 -473.17089844 169.23193359 C-491.59737925 201.10351038 -503.8695698 235.80445822 -510.69140625 271.94140625 C-510.88629639 272.96903076 -511.08118652 273.99665527 -511.28198242 275.05541992 C-514.43487665 292.70412403 -515.25425641 310.16547479 -515.19140625 328.06640625 C-515.18867203 329.68456741 -515.18867203 329.68456741 -515.18588257 331.3354187 C-514.73078017 347.40258526 -511.87890625 363.15035565 -511.87890625 379.00390625 C-511.70198242 380.00486328 -511.52505859 381.00582031 -511.34277344 382.03710938 C-500.76546158 440.166654 -474.85597803 498.86622523 -433.87890625 542.00390625 C-432.7680184 543.28979698 -431.66344965 544.58118418 -430.56640625 545.87890625 C-423.04091129 554.52787557 -414.70830549 562.69578863 -405.87890625 570.00390625 C-405.35554687 570.44637695 -404.8321875 570.88884766 -404.29296875 571.34472656 C-387.66145163 585.38891706 -369.71859017 597.14271006 -350.87890625 608.00390625 C-350.24629883 608.37322266 -349.61369141 608.74253906 -348.96191406 609.12304688 C-278.46431394 649.97650379 -190.60508856 657.53025353 -112.72705078 636.86791992 C-93.81110074 631.61628055 -75.52425262 624.59238156 -57.87890625 616.00390625 C-56.73276855 615.44630615 -56.73276855 615.44630615 -55.56347656 614.87744141 C-35.00392039 604.73722755 -15.72186839 592.37437632 2.12109375 578.00390625 C3.15492188 577.19308594 4.18875 576.38226562 5.25390625 575.546875 C10.80165267 571.13494853 15.8373909 566.41247384 20.78515625 561.33984375 C22.84713025 559.27786975 24.95457987 557.38050687 27.18359375 555.50390625 C31.09245533 552.15233216 34.4656206 548.43654205 37.859375 544.5703125 C39.26832946 542.9715507 40.69979437 541.39201057 42.1640625 539.84375 C61.8875492 518.86210467 76.41054367 493.65627552 89.12109375 468.00390625 C89.51748047 467.21854492 89.91386719 466.43318359 90.32226562 465.62402344 C102.88883864 440.50176699 110.99532902 412.53389286 116.12109375 385.00390625 C116.49886963 383.08022217 116.49886963 383.08022217 116.88427734 381.11767578 C119.06479404 369.73655867 120.02187984 358.4101188 120.77783203 346.85888672 C122.97451132 313.97587411 122.97451132 313.97587411 135.12109375 303.00390625 C144.13510229 296.93708659 152.87227559 295.61851152 163.65625 297.4296875 C172.99231474 300.11360029 179.21663918 306.19180234 183.9296875 314.4765625 C201.84603827 352.48272299 176.78775436 424.91284793 163.87109375 461.50390625 C148.88310118 502.82111583 126.57005895 541.51149284 98.12109375 575.00390625 C97.29996094 576.009375 96.47882812 577.01484375 95.6328125 578.05078125 C97.29996094 576.009375 96.47882812 577.01484375 95.6328125 578.05078125 C88.09243898 587.14681114 79.82637395 595.51443808 71.49609375 603.87890625 C70.91950012 604.46067627 70.34290649 605.04244629 69.74884033 605.6418457 C62.52683264 612.91488054 55.15931036 619.63264598 47.12109375 626.00390625 C45.90753982 627.02769774 44.69856234 628.05696099 43.49609375 629.09375 C25.17662332 644.66543482 4.29963707 657.70517967 -16.87890625 669.00390625 C-17.74757324 669.46845215 -18.61624023 669.93299805 -19.51123047 670.41162109 C-60.82889236 692.2803562 -105.67581132 704.98768404 -151.87890625 711.00390625 C-152.89629883 711.13667969 -153.91369141 711.26945313 -154.96191406 711.40625 C-254.69361198 723.65339883 -357.10594888 691.77577004 -435.7578125 630.50390625 C-444.73619822 623.31220805 -453.3896013 615.76555649 -461.87890625 608.00390625 C-462.94251056 607.04535342 -464.00632425 606.08703289 -465.0703125 605.12890625 C-471.75811153 599.07307891 -477.94502173 592.81237449 -483.87890625 586.00390625 C-484.56984375 585.26269531 -485.26078125 584.52148438 -485.97265625 583.7578125 C-493.21600446 575.97646198 -499.55409774 567.53341632 -505.87890625 559.00390625 C-506.37793457 558.33504395 -506.87696289 557.66618164 -507.39111328 556.97705078 C-554.08354415 494.01798234 -579.46899544 416.08186641 -581.87890625 338.00390625 C-581.90227051 337.26833496 -581.92563477 336.53276367 -581.94970703 335.77490234 C-584.39645161 244.58740493 -551.64832594 152.5623209 -492.87890625 83.00390625 C-492.25569237 82.25767502 -492.25569237 82.25767502 -491.61988831 81.49636841 C-484.45472564 72.91857084 -476.97421729 64.77997801 -469.04223633 56.90649414 C-467.30635894 55.18142148 -465.58155535 53.44578634 -463.85742188 51.70898438 C-457.17052134 45.0139443 -450.29995395 38.88458025 -442.87890625 33.00390625 C-441.66534043 31.98012885 -440.4563631 30.95086512 -439.25390625 29.9140625 C-369.20654967 -29.62670664 -271.12297356 -59.09649572 0 0 Z"
                        transform="translate(708.87890625,182.99609375)"
                      ></path>
                      <path
                        d="M0 0 C6.74416465 5.70826096 8.54398583 10.38230184 9.31640625 19.12890625 C9.4504755 22.44035359 9.45584523 25.74710991 9.45011902 29.06095886 C9.45238458 30.03302995 9.45465013 31.00510103 9.45698434 32.00662881 C9.46329171 35.24946725 9.46249705 38.49226354 9.46166992 41.73510742 C9.46466363 44.06671706 9.46806665 46.3983262 9.47184753 48.72993469 C9.4806747 55.05711813 9.48302524 61.38428804 9.48366332 67.71147704 C9.48449468 72.33788055 9.48739683 76.96428107 9.4904998 81.59068352 C9.4988021 94.05245218 9.5025427 106.5142137 9.50183006 118.97598501 C9.50179011 119.68282353 9.50175015 120.38966205 9.50170898 121.11791992 C9.5016681 121.82563494 9.50162722 122.53334995 9.5015851 123.26251087 C9.50117974 134.70004797 9.51072206 146.13755198 9.52484735 157.57507952 C9.53927726 169.35355579 9.54611377 181.13201599 9.54525357 192.9105013 C9.54492365 199.5090386 9.54777873 206.10754551 9.55843163 212.70607567 C9.56819746 218.92528887 9.56813432 225.14442962 9.56091499 231.36364555 C9.55987929 233.63015093 9.56217071 235.89666102 9.56827545 238.16315842 C9.5957291 249.07416847 9.42623185 259.89951133 8.44184875 270.77192688 C8.36641222 271.63005106 8.29097569 272.48817524 8.2132532 273.37230319 C7.41551399 281.18638267 5.34070275 287.62454183 -0.55859375 293.06640625 C-10.86628884 299.86948501 -22.72317987 300.40561882 -34.671875 298.703125 C-41.68723993 296.92473545 -46.77936075 293.16544438 -50.99609375 287.3046875 C-58.17447782 273.87160848 -55.96816831 254.02943004 -55.92651367 239.30200195 C-55.92758929 237.06755518 -55.9295321 234.83310869 -55.93226624 232.59866333 C-55.93707229 226.58442297 -55.9295127 220.57025796 -55.91931319 214.5560267 C-55.91046296 208.23300543 -55.91229147 201.90998604 -55.91267395 195.58695984 C-55.91174046 184.97649954 -55.90315366 174.36606487 -55.8894043 163.75561523 C-55.87531131 152.87409952 -55.86823417 141.99260895 -55.86889648 131.11108398 C-55.86893644 130.44027207 -55.8689764 129.76946015 -55.86901756 129.0783206 C-55.86905792 128.40858472 -55.86909827 127.73884884 -55.86913985 127.04881793 C-55.86986727 113.97132377 -55.86286698 100.89383979 -55.85369325 87.81634879 C-55.85157065 84.06908163 -55.85085327 80.32181643 -55.85045433 76.57454872 C-55.84944368 70.67041134 -55.84328862 64.76629995 -55.83328819 58.86217117 C-55.83038842 56.7060188 -55.82913265 54.54986343 -55.82971573 52.39370918 C-55.83656744 11.60398378 -55.83656744 11.60398378 -47.68359375 2.12890625 C-35.32228429 -8.58014898 -13.23934408 -9.23092549 0 0 Z"
                        transform="translate(534.68359375,292.87109375)"
                      ></path>
                      <g transform="translate(696.4375,390.4375)">
                        <path
                          id="blinkPath"
                          d="M0 0 C8.13079618 8.13079618 7.81655899 18.7192856 7.83355713 29.61096191 C7.82966977 31.18335012 7.82557351 32.75573782 7.82128906 34.328125 C7.82400338 36.00793611 7.82756678 37.68774602 7.83190918 39.36755371 C7.84098303 43.90470836 7.83750967 48.44177148 7.83115101 52.97892761 C7.82606501 57.74148799 7.83078966 62.50404086 7.83392334 67.26660156 C7.83755543 75.26238401 7.83278379 83.25812943 7.82324219 91.25390625 C7.81235911 100.48000684 7.81588522 109.70601901 7.826895 118.93211746 C7.83598948 126.87296934 7.8372426 134.81379471 7.83201766 142.75465012 C7.82890983 147.48883258 7.82845585 152.22297357 7.83509064 156.95715332 C7.84089497 161.40924694 7.83681102 165.86122726 7.82530212 170.31330872 C7.82267199 171.94102287 7.82339226 173.56874667 7.82782745 175.19645691 C7.88938252 200.09470423 7.88938252 200.09470423 0.1328125 209.25 C-7.59455947 216.64461433 -17.00917255 218.11884556 -27.29589844 217.96704102 C-32.81072824 217.75326391 -37.52414741 217.09708358 -42.4375 214.5625 C-43.05753906 214.26859375 -43.67757812 213.9746875 -44.31640625 213.671875 C-50.36556168 210.17042002 -53.15273281 203.94287152 -55.4375 197.5625 C-57.65422559 188.72559408 -57.7230978 179.92673097 -57.69628906 170.88012695 C-57.69900486 169.32812843 -57.70256907 167.77613119 -57.70690918 166.22413635 C-57.71596929 162.03786394 -57.71251442 157.85169094 -57.70615101 153.66541696 C-57.70105326 149.26068132 -57.7057933 144.85595365 -57.70892334 140.45121765 C-57.71255396 133.05152882 -57.70778968 125.65188001 -57.70824432 118.25219727 C-57.69738197 109.73567112 -57.70087338 101.21924092 -57.71189737 92.70271713 C-57.72102022 85.35707484 -57.72223063 78.01146118 -57.71701766 70.66581506 C-57.71392269 66.29363099 -57.71341928 61.92149175 -57.72009064 57.54931068 C-57.72593594 53.43123785 -57.7217382 49.31328658 -57.71030212 45.19522667 C-57.70769258 43.69742406 -57.70835574 42.19961095 -57.71282745 40.70181274 C-57.79510054 10.30393567 -57.79510054 10.30393567 -51.4375 2.5625 C-38.41779291 -10.28006822 -14.34613809 -11.11913392 0 0 Z"
                        ></path>
                      </g>
                    </g>
                  </g>
                </g>
              </svg>
              <span className="text-2xl font-semibold">thecueRoom</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("signin")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === "signin"
                    ? "text-[#D7FF3C] border-b-2 border-[#D7FF3C]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab("signup")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === "signup"
                    ? "text-[#D7FF3C] border-b-2 border-[#D7FF3C]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setActiveTab("forgot")}
                className={`px-6 py-2 text-sm font-medium transition-colors ${
                  activeTab === "forgot"
                    ? "text-[#D7FF3C] border-b-2 border-[#D7FF3C]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Forgot
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto flex-1">
            {/* Main Form Column */}
            <div className="flex-1">
              {/* Sign In Form */}
              {activeTab === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <p className="text-[#9B5CFF] text-sm">
                    Welcome back. Enter your credentials to continue.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm text-white">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@artist.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 text-sm rounded-lg pl-10 pr-4"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 text-sm rounded-lg pl-10 pr-4"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8 rounded-full text-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Sign In
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-11 px-8 rounded-full text-sm"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot")}
                    className="text-sm text-gray-400 hover:text-[#9B5CFF] transition-colors"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {activeTab === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-base font-bold text-white">
                        Create your {isArtist ? "artist " : ""}account
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab("signin")}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Have an account? <span className="text-[#D7FF3C]">Sign in</span>
                      </button>
                    </div>
                    <p className="text-[#9B5CFF] text-sm italic">
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
                        <p className="text-xs text-[#9B5CFF]">
                          Additional verification fields will appear for artist accounts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm text-white font-medium">
                        First Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Alex"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 text-sm focus:border-[#D7FF3C] rounded-lg pl-10 pr-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm text-white font-medium">
                        Last Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Rivera"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 text-sm focus:border-[#D7FF3C] rounded-lg pl-10 pr-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {isArtist && (
                    <div className="space-y-1.5">
                      <Label htmlFor="artistName" className="text-sm text-white font-medium">
                        Artist Name *
                      </Label>
                      <div className="relative">
                        <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="artistName"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          placeholder="Your stage name"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-10"
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

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm text-white font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-10"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm text-white font-medium">
                        Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 10 characters"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm text-white font-medium">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-4"
                          disabled={isLoading}
                          required
                        />
                      </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="primaryGenre" className="text-sm text-white font-medium">
                            Primary Genre *
                          </Label>
                          <div className="relative">
                            <Music className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="primaryGenre"
                              value={genre}
                              onChange={(e) => setGenre(e.target.value)}
                              placeholder="Techno"
                              maxLength={120}
                              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-4"
                              disabled={isLoading}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="cityRegion" className="text-sm text-white font-medium">
                            City / Region *
                          </Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="cityRegion"
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              placeholder="Berlin, DE"
                              maxLength={60}
                              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-4"
                              disabled={isLoading}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="portfolio" className="text-sm text-white font-medium">
                          Portfolio / Music Links *
                        </Label>
                        <div className="relative">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="portfolio"
                            type="url"
                            value={publicProfileUrl}
                            onChange={(e) => setPublicProfileUrl(e.target.value)}
                            placeholder="SoundCloud / Spotify / EPK"
                            className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 focus:border-[#D7FF3C] text-sm rounded-lg pl-10 pr-4"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          SoundCloud, Spotify, Bandcamp, Mixcloud, Beatport, or YouTube
                        </p>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
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
                        (isArtist && !publicProfileUrl)
                      }
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8 rounded-full disabled:opacity-50 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          {isArtist ? "Create Artist Account" : "Create Account"}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-11 px-8 rounded-full text-sm"
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>

                  {isArtist && (
                    <div className="flex items-start gap-2 p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg mt-3">
                      <Info className="h-4 w-4 text-[#D7FF3C] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#9B5CFF]">
                        thecueRoom's AI verification system automatically authenticates artist profiles to prevent fraudulent accounts, duplicate registrations, and identity misrepresentation.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center pt-2">
                    By continuing, you agree to our{" "}
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
                    </button>
                    .
                  </p>
                </form>
              )}

              {/* Forgot Password Form */}
              {activeTab === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Enter your email to receive a password reset link.
                  </p>

                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-sm text-white">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-11 text-sm rounded-lg pl-10 pr-4"
                        disabled={isLoading}
                      />
                    </div>
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

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#D7FF3C] text-black hover:bg-[#c5ed2a] font-semibold h-11 px-8 rounded-full text-sm"
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
                      className="border-[#2a2a2a] bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] h-11 px-8 rounded-full text-sm"
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