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
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useToast } from "@/src/hooks/use-toast";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

/**
 * thecueRoom V2 - Authentication Portal
 * High-authority implementation aligned with DB schema and project rules.
 */

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = "signin" | "signup" | "forgot";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signin");

  // Form state
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

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

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
      toast({ variant: "destructive", title: "Error", description: "Connection error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        email,
        password,
        firstName,
        lastName,
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
        toast({ variant: "destructive", title: "Registration Failed", description: data.error || "Check your details and try again." });
        return;
      }

      toast({ title: "Welcome", description: "Account created successfully." });
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
        toast({ variant: "destructive", title: "Request Failed", description: data.error || "Unable to process request." });
        return;
      }
      toast({ title: "Check Email", description: "Reset instructions sent if account exists." });
      setActiveTab("signin");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "System unavailable." });
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
            className="w-[95vw] max-w-[480px] bg-[#0B0B0B] border-none text-white p-0 shadow-2xl rounded-none outline-none sm:w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <motion.div
              className="flex flex-col flex-grow overflow-hidden relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="sr-only">Authentication</DialogTitle>
              
              <DialogPrimitive.Close className="absolute right-6 top-6 rounded-sm opacity-40 transition-opacity hover:opacity-100 focus:outline-none z-50">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>

              <div className="px-6 pt-10 pb-6 sm:px-10 flex flex-col items-center flex-shrink-0">
                <Logo className="w-12 h-12 text-[#D7FF3C] mb-4" />
                <span className="text-2xl font-bold tracking-tight text-white mb-1">thecueRoom</span>
                <p className="text-[11px] font-mono tracking-widest uppercase text-gray-500">Music & Intelligence</p>
              </div>

              <div className="flex px-6 sm:px-10 border-b border-white/[0.05] flex-shrink-0">
                {(["signin", "signup", "forgot"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-[11px] font-mono uppercase tracking-widest transition-all duration-300 relative focus:outline-none`}
                  >
                    <span className={activeTab === tab ? "text-[#D7FF3C]" : "text-gray-500"}>
                      {tab === "signin" ? "Sign In" : tab === "signup" ? "Sign Up" : "Recovery"}
                    </span>
                    {activeTab === tab && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D7FF3C]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="px-6 py-8 sm:px-10 overflow-y-auto flex-grow scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "signin" && (
                      <form onSubmit={handleSignIn} className="space-y-8">
                        <FieldGroup label="Email">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                            required
                          />
                        </FieldGroup>
                        <FieldGroup label="Password">
                          <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                            required
                          />
                        </FieldGroup>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} />
                      </form>
                    )}

                    {activeTab === "signup" && (
                      <form onSubmit={handleSignUp} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <FieldGroup label="First Name">
                            <Input
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="First"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                              required
                            />
                          </FieldGroup>
                          <FieldGroup label="Last Name">
                            <Input
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Last"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                              required
                            />
                          </FieldGroup>
                        </div>
                        <FieldGroup label="Email">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                            required
                          />
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldGroup label="Password">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create password"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                              required
                            />
                          </FieldGroup>
                          <FieldGroup label="Confirm">
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                              required
                            />
                          </FieldGroup>
                        </div>

                        <div className="pt-2 space-y-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isArtist}
                              onChange={(e) => setIsArtist(e.target.checked)}
                              className="accent-[#D7FF3C] h-4 w-4 rounded-none bg-black border-white/20"
                            />
                            <span className="text-[11px] font-mono uppercase tracking-widest text-gray-500">I am an Artist</span>
                          </label>

                          {isArtist && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 pt-2">
                              <FieldGroup label="Artist Name">
                                <Input
                                  value={artistName}
                                  onChange={(e) => setArtistName(e.target.value)}
                                  placeholder="Artist alias"
                                  className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                                  required={isArtist}
                                />
                              </FieldGroup>
                              <div className="grid grid-cols-2 gap-4">
                                <FieldGroup label="Region">
                                  <Input
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="Location"
                                    className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                                    required={isArtist}
                                  />
                                </FieldGroup>
                                <FieldGroup label="Genre">
                                  <Input
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    placeholder="Genre"
                                    className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                                    required={isArtist}
                                  />
                                </FieldGroup>
                              </div>
                              <FieldGroup label="Portfolio URL">
                                <Input
                                  value={publicProfileUrl}
                                  onChange={(e) => setPublicProfileUrl(e.target.value)}
                                  placeholder="Spotify / Soundcloud"
                                  className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-10 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                                  required={isArtist}
                                />
                              </FieldGroup>
                            </motion.div>
                          )}
                        </div>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} />
                      </form>
                    )}

                    {activeTab === "forgot" && (
                      <form onSubmit={handleForgotPassword} className="space-y-8">
                        <p className="text-[11px] font-mono leading-relaxed text-gray-500 uppercase tracking-widest">
                          Enter your email to receive recovery instructions.
                        </p>
                        <FieldGroup label="Email">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-700"
                            required
                          />
                        </FieldGroup>
                        <ActionZone activeTab={activeTab} isLoading={isLoading} />
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="bg-[#050505] px-6 py-4 sm:px-10 border-t border-white/[0.05] flex justify-between items-center flex-shrink-0">
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">© thecueRoom</span>
                <span className="text-[8px] font-mono text-gray-700 uppercase tracking-widest">PRODUCTION READY</span>
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
    <div className="relative">
      <Label className="text-[10px] font-mono uppercase tracking-widest text-gray-600 mb-2 block">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ActionZone({ activeTab, isLoading }: { activeTab: string, isLoading: boolean }) {
  return (
    <div className="pt-4">
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-white/[0.05] border border-white/10 hover:bg-[#D7FF3C] hover:border-[#D7FF3C] text-white hover:text-black font-mono uppercase tracking-widest text-[11px] transition-all duration-300 rounded-none group"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <span className="flex items-center gap-2">
            {activeTab === 'signin' ? 'Sign In' : activeTab === 'signup' ? 'Create Account' : 'Send Instructions'} 
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </Button>
    </div>
  );
}
