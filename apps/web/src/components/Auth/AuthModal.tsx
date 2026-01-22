"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ChevronRight,
  X,
} from "lucide-react";
import { generateUsername } from "@/src/lib/username-generator";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useToast } from "@/src/hooks/use-toast";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = "signin" | "signup" | "forgot";

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

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, value: val.trim() }),
          signal: controller.signal,
        });

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
          reason: "Error checking availability",
        });
      }
    },
    [type],
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [, setGeneratedUsername] = useState("");

  const artistAvailability = useAvailability("artist", artistName);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

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
    setIsLoading(false);
    setActiveTab("signin");
    setGeneratedUsername("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ variant: "destructive", title: "Authentication Failed", description: data.error || "Invalid credentials" });
        return;
      }
      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "A system error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Confirmation does not match." });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        email,
        password,
        firstName,
        lastName,
        isArtist,
        artistName: isArtist ? artistName : undefined,
        region: isArtist ? region : undefined,
        genre: isArtist ? genre : undefined,
        publicProfileUrl: isArtist ? publicProfileUrl : undefined,
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ variant: "destructive", title: "Registration Failed", description: data.error || "Please check your details." });
        return;
      }

      toast({ title: "Account Created", description: "Welcome to thecueRoom." });
      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred during registration." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ variant: "destructive", title: "Request Failed", description: data.error || "Unable to send reset link." });
        return;
      }
      toast({ title: "Link Sent", description: "Please check your inbox." });
      setActiveTab("signin");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "A system error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent 
            forceMount
            className="w-[95vw] max-w-[500px] bg-[#0A0A0A] border-none text-white p-0 shadow-2xl rounded-none outline-none sm:w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <motion.div
              className="flex flex-col flex-grow overflow-hidden relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] to-transparent z-0" />
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

              <DialogTitle className="sr-only">Authentication Portal</DialogTitle>
              
              <DialogPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-20 transition-opacity hover:opacity-100 focus:outline-none z-50">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>

              <div className="px-6 pt-12 pb-8 sm:px-10 flex flex-col items-center relative z-10 flex-shrink-0">
                <div className="flex items-center gap-4 mb-4 group">
                  <Logo className="w-10 h-10 text-[#D7FF3C] transition-transform duration-700 group-hover:scale-105" />
                  <span className="text-2xl font-bold tracking-tight text-white">thecueRoom</span>
                </div>
                <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-gray-500">Music News & Creative AI</p>
                <div className="absolute bottom-0 left-6 right-6 sm:left-10 sm:right-10 h-[1px] bg-white/[0.05]" />
              </div>

              <div className="flex px-6 sm:px-10 relative z-10 border-b border-white/[0.05] flex-shrink-0 bg-black/40 backdrop-blur-sm">
                {(["signin", "signup", "forgot"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-mono uppercase tracking-widest transition-all duration-500 relative group focus:outline-none`}
                  >
                    <span className={`transition-colors duration-500 ${
                      activeTab === tab 
                        ? "text-[#D7FF3C]" 
                        : "text-gray-600 group-hover:text-gray-400"
                    }`}>
                      {tab === "signin" ? "Sign In" : tab === "signup" ? "Sign Up" : "Forgot"}
                    </span>
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-700 transform origin-left ${
                      activeTab === tab 
                        ? "bg-[#D7FF3C] scale-x-100 opacity-100" 
                        : "bg-transparent scale-x-0 opacity-0"
                    }`} />
                  </button>
                ))}
              </div>

              <div className="px-6 py-8 sm:px-10 relative z-10 overflow-y-auto flex-grow scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {activeTab === "signin" && (
                      <form onSubmit={handleSignIn} className="space-y-10">
                        <div className="space-y-8">
                          <FieldGroup label="Email Address">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@email.com"
                              className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                              required
                            />
                          </FieldGroup>
                          <FieldGroup label="Password">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                              required
                            />
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setActiveTab("forgot")}
                                className="text-[10px] font-mono uppercase tracking-widest text-gray-600 hover:text-white transition-colors py-2 focus:outline-none"
                              >
                                Recover Password
                              </button>
                            </div>
                          </FieldGroup>
                        </div>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} onClose={onClose} />
                      </form>
                    )}

                    {activeTab === "signup" && (
                      <form onSubmit={handleSignUp} className="space-y-10">
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-6">
                            <FieldGroup label="First Name">
                              <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First"
                                className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                required
                              />
                            </FieldGroup>
                            <FieldGroup label="Last Name">
                              <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last"
                                className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                required
                              />
                            </FieldGroup>
                          </div>
                          <FieldGroup label="Email Address">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@email.com"
                              className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                              required
                            />
                          </FieldGroup>
                          <div className="grid grid-cols-2 gap-6">
                            <FieldGroup label="Password">
                              <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                required
                              />
                            </FieldGroup>
                            <FieldGroup label="Confirm">
                              <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                required
                              />
                            </FieldGroup>
                          </div>

                          <div className="pt-2 space-y-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className="relative w-8 h-8 border border-white/10 flex items-center justify-center transition-colors group-hover:border-[#D7FF3C]/50 flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isArtist}
                                  onChange={(e) => setIsArtist(e.target.checked)}
                                  className="sr-only"
                                />
                                {isArtist && <div className="w-3 h-3 bg-[#D7FF3C]" />}
                              </div>
                              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Register as Artist</span>
                            </label>

                            {isArtist && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-8 pt-2">
                                <FieldGroup label="Artist Name">
                                  <Input
                                    value={artistName}
                                    onChange={(e) => setArtistName(e.target.value)}
                                    placeholder="Alias"
                                    className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                    required
                                  />
                                </FieldGroup>
                                <div className="grid grid-cols-2 gap-6">
                                  <FieldGroup label="Region">
                                    <Input
                                      value={region}
                                      onChange={(e) => setRegion(e.target.value)}
                                      placeholder="Location"
                                      className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                      required
                                    />
                                  </FieldGroup>
                                  <FieldGroup label="Genre">
                                    <Input
                                      value={genre}
                                      onChange={(e) => setGenre(e.target.value)}
                                      placeholder="Genre"
                                      className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                      required
                                    />
                                  </FieldGroup>
                                </div>
                                <FieldGroup label="Portfolio URL">
                                  <Input
                                    value={publicProfileUrl}
                                    onChange={(e) => setPublicProfileUrl(e.target.value)}
                                    placeholder="Link"
                                    className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                                    required
                                  />
                                </FieldGroup>
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} onClose={onClose} />
                      </form>
                    )}

                    {activeTab === "forgot" && (
                      <form onSubmit={handleForgotPassword} className="space-y-10">
                        <div className="space-y-8">
                          <div className="p-4 bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] font-mono leading-relaxed text-gray-500 uppercase tracking-widest">
                              Enter your email to receive a password recovery link.
                            </p>
                          </div>
                          <FieldGroup label="Email Address">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@email.com"
                              className="bg-transparent border-white/[0.08] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] transition-all duration-500 placeholder:text-gray-800"
                              required
                            />
                          </FieldGroup>
                        </div>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} onClose={onClose} />
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="bg-[#050505] px-6 py-4 sm:px-10 border-t border-white/[0.05] flex justify-between items-center relative z-10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-[#D7FF3C]/30 rounded-full" />
                  <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">Secure Access</span>
                </div>
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">thecueRoom v2.4.0</span>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

function FieldGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="relative group/field">
      <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-600 group-focus-within/field:text-white transition-colors duration-300 block mb-3">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ActionZone({ activeTab, isLoading, onClose }: { activeTab: string, isLoading: boolean, onClose: () => void }) {
  return (
    <div className="pt-4 flex flex-col gap-6">
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 bg-white/[0.03] border border-white/10 hover:bg-[#D7FF3C] hover:border-[#D7FF3C] text-white hover:text-black font-mono uppercase tracking-widest text-[10px] transition-all duration-700 rounded-none group"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <span className="flex items-center gap-2">
            {activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Sign Up' : 'Send Recovery Link'} 
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="text-[10px] font-mono uppercase tracking-widest text-gray-700 hover:text-white transition-colors py-2 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  );
}
