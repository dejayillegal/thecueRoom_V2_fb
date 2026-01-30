"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useToast } from "@/src/hooks/use-toast";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

/**
 * thecueRoom V2 - Authentication Portal
 * Final high-authority professional implementation.
 * Aligned with landing page identity, schema fields synced.
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

  // ✅ Added: error state (you referenced it in actual file)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  // Clear error when tab switches or modal reopens
  useEffect(() => {
    if (isOpen) setError(null);
  }, [activeTab, isOpen]);

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
    setError(null);
    setActiveTab("signin");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          deviceHash:
            typeof window !== "undefined"
              ? btoa(window.navigator.userAgent)
              : "unknown",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || "Invalid credentials";
        setError(msg);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: msg,
        });
        return;
      }

      if (data?.challengeRequired) {
        toast({
          title: "Verification Required",
          description: "A code has been sent to your email for secure access.",
        });
        return;
      }

      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch {
      const msg = "Connection error. Please try again.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: msg,
      });
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
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || "Check your details and try again.";
        setError(msg);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: msg,
        });
        return;
      }

      toast({ title: "Welcome", description: "Account created successfully." });

      onClose();
      router.push("/dashboard");
      router.refresh();
    } catch {
      const msg = "An error occurred during registration.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || "Unable to process request.";
        setError(msg);
        toast({
          variant: "destructive",
          title: "Request Failed",
          description: msg,
        });
        return;
      }

      toast({
        title: "Check Email",
        description: "Recovery instructions sent if account exists.",
      });

      setActiveTab("signin");
    } catch {
      const msg = "System unavailable.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
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

              {/* Header */}
              <div className="px-6 pt-12 pb-8 sm:px-10 flex flex-col items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-4 mb-2 group">
                  <Logo className="w-16 h-16 text-[#D7FF3C] brightness-110" />
                  <span className="text-3xl font-bold tracking-tight text-white">
                    thecueRoom
                  </span>
                </div>
                <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-gray-500">
                  Music News & Creative AI
                </p>
              </div>

              {/* Tabs */}
              <div className="flex px-6 sm:px-10 border-b border-white/[0.05] flex-shrink-0 bg-black/20 backdrop-blur-sm">
                {(["signin", "signup", "forgot"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-5 text-[11px] font-mono uppercase tracking-widest transition-all duration-300 relative focus:outline-none group"
                  >
                    <span
                      className={`transition-colors duration-300 ${
                        activeTab === tab
                          ? "text-[#D7FF3C]"
                          : "text-gray-600 group-hover:text-gray-400"
                      }`}
                    >
                      {tab === "signin"
                        ? "Entrance"
                        : tab === "signup"
                          ? "Registry"
                          : "Recovery"}
                    </span>

                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D7FF3C]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="px-6 py-10 sm:px-10 overflow-y-auto flex-grow scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "signin" && (
                      <form onSubmit={handleSignIn} className="space-y-10">
                        <div className="space-y-8">
                          <FieldGroup label="Email">
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email address"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-base focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                              required
                            />
                          </FieldGroup>

                          <FieldGroup label="Password">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-base focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                              required
                            />
                          </FieldGroup>

                          <AnimatePresence>
                            {error && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                              >
                                {error}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <ActionZone
                          activeTab={activeTab}
                          isLoading={isLoading}
                        />
                      </form>
                    )}

                    {activeTab === "signup" && (
                      <form onSubmit={handleSignUp} className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                          <FieldGroup label="First Name">
                            <Input
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="First"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                              required
                            />
                          </FieldGroup>

                          <FieldGroup label="Last Name">
                            <Input
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Last"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
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
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                            required
                          />
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-8">
                          <FieldGroup label="Password">
                            <Input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create password"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                              required
                            />
                          </FieldGroup>

                          <FieldGroup label="Confirm">
                            <Input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Confirm password"
                              className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                              required
                            />
                          </FieldGroup>
                        </div>

                        <div className="pt-4 space-y-6">
                          <label className="flex items-center gap-4 cursor-pointer group">
                            <div className="relative w-10 h-10 border border-white/10 flex items-center justify-center transition-colors group-hover:border-[#D7FF3C]/50 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isArtist}
                                onChange={(e) => setIsArtist(e.target.checked)}
                                className="sr-only"
                              />
                              {isArtist && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-4 h-4 bg-[#D7FF3C]"
                                />
                              )}
                            </div>
                            <span className="text-[11px] font-mono uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                              Register as Professional Artist
                            </span>
                          </label>

                          {isArtist && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-8 pt-4 border-t border-white/[0.05]"
                            >
                              <FieldGroup label="Artist Name">
                                <Input
                                  value={artistName}
                                  onChange={(e) =>
                                    setArtistName(e.target.value)
                                  }
                                  placeholder="Alias"
                                  className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800"
                                  required={isArtist}
                                />
                              </FieldGroup>

                              <div className="grid grid-cols-2 gap-8">
                                <FieldGroup label="Region">
                                  <Input
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="Location"
                                    className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800"
                                    required={isArtist}
                                  />
                                </FieldGroup>

                                <FieldGroup label="Genre">
                                  <Input
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    placeholder="Genre"
                                    className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800"
                                    required={isArtist}
                                  />
                                </FieldGroup>
                              </div>

                              <FieldGroup label="Portfolio URL">
                                <Input
                                  value={publicProfileUrl}
                                  onChange={(e) =>
                                    setPublicProfileUrl(e.target.value)
                                  }
                                  placeholder="Primary Social Link"
                                  className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-11 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800"
                                  required={isArtist}
                                />
                              </FieldGroup>
                            </motion.div>
                          )}
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                            >
                              {error}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <ActionZone
                          activeTab={activeTab}
                          isLoading={isLoading}
                        />
                      </form>
                    )}

                    {activeTab === "forgot" && (
                      <form
                        onSubmit={handleForgotPassword}
                        className="space-y-10"
                      >
                        <div className="p-6 bg-white/[0.03] border border-white/[0.05]">
                          <p className="text-[11px] font-mono leading-relaxed text-gray-400 uppercase tracking-widest">
                            Identity Recovery initiated. Enter your registered
                            email to receive access instructions.
                          </p>
                        </div>

                        <FieldGroup label="Email">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            className="bg-transparent border-white/[0.1] border-x-0 border-t-0 border-b rounded-none px-0 h-12 text-sm focus-visible:ring-0 focus-visible:border-[#D7FF3C] placeholder:text-gray-800 transition-all duration-300"
                            required
                          />
                        </FieldGroup>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                            >
                              {error}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <ActionZone
                          activeTab={activeTab}
                          isLoading={isLoading}
                        />
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="bg-[#050505] px-6 py-4 sm:px-10 border-t border-white/[0.05] flex justify-between items-center flex-shrink-0">
                <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">
                  © 2026 thecueRoom
                </span>
                <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">
                  Authorized Access
                </span>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group/field">
      <Label className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-700 group-focus-within/field:text-white transition-colors duration-300 block mb-4">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ActionZone({
  activeTab,
  isLoading,
}: {
  activeTab: ActiveTab;
  isLoading: boolean;
}) {
  return (
    <div className="pt-6">
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-16 bg-[#0B0B0B] border border-white/10 hover:bg-[#D7FF3C] hover:border-[#D7FF3C] text-white hover:text-black font-mono uppercase tracking-[0.2em] text-[11px] transition-all duration-500 rounded-none group"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="flex items-center gap-3">
            {activeTab === "signin"
              ? "Initiate Entrance"
              : activeTab === "signup"
                ? "Complete Registry"
                : "Send Instructions"}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </span>
        )}
      </Button>
    </div>
  );
}
