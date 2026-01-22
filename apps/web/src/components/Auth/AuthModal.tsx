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
  ChevronRight,
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

interface AvailabilityResult {
  available: boolean | null;
  checking: boolean;
  reason?: string | null;
}

export function useAvailability(
  type: "email" | "artist" | "username",
  value: string,
  debounceMs: number = 400,
): AvailabilityResult {
  const [result, setResult] = useState<AvailabilityResult>({
    available: null,
    checking: false,
  });

  const abortControllerRef = useCallback(() => new AbortController(), []);
  const controllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(
    async (val: string) => {
      if (!val || val.trim() === '') {
        setResult({ available: null, checking: false });
        return;
      }

      setResult({ available: null, checking: true });

      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      const controller = abortControllerRef();
      controllerRef.current = controller;

      try {
        const response = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: val.trim() }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResult({
          available: data.available,
          checking: false,
          reason: data.reason || null,
        });
      } catch (error: any) {
        if (error.name === "AbortError") return;
        setResult({
          available: false,
          checking: false,
          reason: error.message || "An unknown error occurred",
        });
      }
    },
    [type, abortControllerRef],
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => checkAvailability(value), debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [value, debounceMs, checkAvailability]);

  return result;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);
  const [agreeTerms] = useState(true);

  const [generatedUsername, setGeneratedUsername] = useState("");

  const emailAvailability = useAvailability("email", email);
  const artistAvailability = useAvailability("artist", artistName);

  const [verificationJobId, setVerificationJobId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [activeTab]);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ variant: "destructive", title: "Sign In Failed", description: data.error || "Invalid credentials" });
        return;
      }
      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] bg-[#0A0A0A] border border-[#1A1A1A] text-white p-0 overflow-hidden shadow-2xl rounded-none">
        <DialogTitle className="sr-only">Authentication Portal</DialogTitle>

        {/* Identity Zone */}
        <div className="px-10 pt-12 pb-8 flex flex-col items-center border-b border-[#111]">
          <div className="w-12 h-12 mb-6 bg-[#D7FF3C] flex items-center justify-center">
            <Logo className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-sm font-mono tracking-[0.3em] uppercase text-gray-500">The Cue Room</h2>
          <p className="mt-2 text-xl font-medium tracking-tight text-white">Secure Portal Access</p>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-[#111]">
          {(["signin", "signup", "forgot"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab 
                  ? "text-[#D7FF3C] bg-[#0F0F0F]" 
                  : "text-gray-600 hover:text-gray-400 bg-black"
              }`}
            >
              {tab === "signin" ? "Entrance" : tab === "signup" ? "Registry" : "Recovery"}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="px-10 py-10">
          <form onSubmit={handleSignIn} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Identifier</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL@THECUEROOM.COM"
                  className="bg-black border-[#1A1A1A] border-x-0 border-t-0 border-b rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-colors placeholder:text-gray-800"
                />
              </div>

              {activeTab !== "forgot" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Security Key</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-black border-[#1A1A1A] border-x-0 border-t-0 border-b rounded-none px-0 h-10 focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-colors placeholder:text-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Action Zone */}
            <div className="pt-4 flex flex-col gap-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white hover:bg-[#D7FF3C] text-black font-mono uppercase tracking-widest text-xs transition-all duration-500 rounded-none group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Access <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>

              <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-gray-600">
                <span>Encrypted Session</span>
                <span>ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
            </div>
          </form>
        </div>

        {/* Status Bar */}
        <div className="bg-[#050505] px-10 py-3 border-t border-[#111] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-gray-700 uppercase tracking-tighter">System Nominal</span>
          </div>
          <span className="text-[8px] font-mono text-gray-800 uppercase">v2.4.0-Stable</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
