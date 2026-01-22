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
  Mail,
  Lock,
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isArtist, setIsArtist] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [region, setRegion] = useState("");
  const [genre, setGenre] = useState("");
  const [publicProfileUrl, setPublicProfileUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([""]);

  const [generatedUsername, setGeneratedUsername] = useState("");

  const artistAvailability = useAvailability("artist", artistName);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    setError("");
  }, [activeTab]);

  useEffect(() => {
    if (artistName && artistAvailability.available) {
      setGeneratedUsername(generateUsername(artistName));
    }
  }, [artistName, artistAvailability.available]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setIsArtist(false);
    setArtistName("");
    setRegion("");
    setGenre("");
    setPublicProfileUrl("");
    setSocialLinks([""]);
    setError("");
    setIsLoading(false);
    setActiveTab("signin");
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
      <AnimatePresence>
        {isOpen && (
          <DialogContent 
            forceMount
            asChild
            className="max-w-[500px] bg-[#0A0A0A] border-none text-white p-0 overflow-hidden shadow-2xl rounded-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <DialogTitle className="sr-only">Authentication Portal</DialogTitle>
              
              <DialogPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-20 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>

              {/* Header / Identity Zone */}
              <div className="px-10 pt-14 pb-10 flex flex-col items-center relative">
                <div className="flex items-center gap-3 mb-6 group">
                  <Logo className="w-10 h-10 text-[#D7FF3C] transition-transform duration-700 group-hover:scale-105" />
                  <span className="text-2xl font-bold tracking-[-0.04em] text-white">thecueRoom</span>
                </div>
                <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-gray-700">Secure Access Portal</p>
                
                <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-white/[0.03]" />
              </div>

              {/* Mode Indicators */}
              <div className="flex px-10">
                {(["signin", "signup", "forgot"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-5 text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-500 relative group`}
                  >
                    <span className={`transition-colors duration-500 ${
                      activeTab === tab 
                        ? "text-[#D7FF3C]" 
                        : "text-gray-800 group-hover:text-gray-500"
                    }`}>
                      {tab === "signin" ? "Entrance" : tab === "signup" ? "Registry" : "Recovery"}
                    </span>
                    <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-700 transform origin-left ${
                      activeTab === tab 
                        ? "bg-[#D7FF3C] scale-x-100 opacity-100" 
                        : "bg-white/5 scale-x-0 opacity-0 group-hover:opacity-30 group-hover:scale-x-100"
                    }`} />
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <div className="px-10 py-12 relative min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <form onSubmit={handleSignIn} className="space-y-12">
                      <div className="space-y-10">
                        {/* Identifier Field */}
                        <div className="relative group/field">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-700 group-focus-within/field:text-[#D7FF3C]/80 transition-colors duration-200">Identifier</Label>
                            <Mail className="w-3 h-3 text-gray-900 group-focus-within/field:text-[#D7FF3C]/30 transition-colors duration-200" />
                          </div>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="EMAIL@THECUEROOM.COM"
                            className="bg-transparent border-white/[0.03] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C]/60 transition-all duration-300 placeholder:text-gray-900"
                          />
                        </div>

                        {/* Security Key Field */}
                        {activeTab !== "forgot" && (
                          <div className="relative group/field">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-700 group-focus-within/field:text-[#D7FF3C]/80 transition-colors duration-200">Security Key</Label>
                              <Lock className="w-3 h-3 text-gray-900 group-focus-within/field:text-[#D7FF3C]/30 transition-colors duration-200" />
                            </div>
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="bg-transparent border-white/[0.03] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C]/60 transition-all duration-300 placeholder:text-gray-900"
                            />
                            {activeTab === "signin" && (
                              <div className="flex justify-end mt-4">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab("forgot")}
                                  className="text-[10px] font-mono uppercase tracking-widest text-gray-700 hover:text-white transition-colors"
                                >
                                  Recovery Needed?
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Zone */}
                      <div className="pt-2 flex flex-col gap-6">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-14 bg-white/[0.03] border border-white/5 hover:bg-[#D7FF3C] hover:border-[#D7FF3C] text-white hover:text-black font-mono uppercase tracking-widest text-[10px] transition-all duration-700 rounded-none group"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <span className="flex items-center gap-2">
                              Initialize Access <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          )}
                        </Button>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={onClose}
                            className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-800 hover:text-gray-400 transition-colors py-2"
                          >
                            Return to Surface
                          </button>
                        </div>

                        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest text-gray-800 border-t border-white/[0.02] pt-4">
                          <span>Session Secure</span>
                          <span>SYS_ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Status Bar */}
              <div className="bg-[#050505] px-10 py-3 border-t border-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500/30 rounded-full" />
                  <span className="text-[8px] font-mono text-gray-800 uppercase tracking-tighter">System Nominal</span>
                </div>
                <span className="text-[8px] font-mono text-gray-800 uppercase">v2.4.0-Stable</span>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
