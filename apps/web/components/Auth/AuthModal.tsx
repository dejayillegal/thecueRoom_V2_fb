"use client";

import React, { useState } from "react";
import { SignupModal } from "./SignupModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../Logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup" | "forgot";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.ok) {
        setTab("signin");
      } else {
        setError(data.error || "Failed to send recovery link");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px] w-[95vw] bg-[#0B0B0B] border border-white/5 p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-none ring-0 focus:ring-0 sm:rounded-none">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-zinc-600 hover:text-white transition-all duration-300 z-50 p-2"
          aria-label="Close"
          type="button"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header Section */}
          <div className="px-8 pt-12 pb-6 sm:px-12 flex flex-col items-center text-center">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Logo className="w-10 h-10 text-[#D1FF3D]" />
              <div className="space-y-1">
                <h2 className="text-xl font-light tracking-[0.4em] uppercase text-white">
                  thecueRoom
                </h2>
                <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-zinc-500">
                  Music, culture & creative intelligence
                </p>
              </div>
            </div>

            {/* Segmented Navigation Rail */}
            <div className="flex w-full bg-white/[0.02] border border-white/[0.05] p-1 rounded-none mt-4">
              {(["signin", "signup", "forgot"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError("");
                  }}
                  className={`flex-1 py-3 text-[9px] uppercase tracking-[0.2em] font-bold transition-all duration-300 relative ${
                    tab === t
                      ? "text-[#D1FF3D]"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <span className="relative z-10">
                    {t === "signin"
                      ? "Entrance"
                      : t === "signup"
                        ? "Registry"
                        : "Recovery"}
                  </span>

                  {tab === t && (
                    <motion.div
                      layoutId="activeRail"
                      className="absolute inset-0 bg-white/[0.03]"
                      style={{
                        boxShadow: "inset 0 0 15px rgba(209,255,61,0.05)",
                      }}
                      transition={{
                        duration: 0.2,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow overflow-y-auto scrollbar-hide">
            <motion.div
              initial={false}
              animate={{ height: "auto" }}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  {...contentVariants}
                  className="px-8 pb-12 sm:px-12 sm:pb-16 pt-6"
                >
                  {tab === "signup" ? (
                    <SignupModal
                      open={true}
                      onOpenChange={(open) => !open && onClose()}
                      onSwitchToSignin={() => setTab("signin")}
                      isEmbedded={true}
                    />
                  ) : tab === "forgot" ? (
                    <div className="space-y-10">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-extralight tracking-tighter text-white">
                          Restore Access
                        </h3>
                        <p className="text-[10px] font-mono leading-relaxed text-zinc-500 uppercase tracking-widest">
                          Enter your registered email to receive access
                          instructions.
                        </p>
                      </div>

                      <form onSubmit={handleForgot} className="space-y-8">
                        <div className="space-y-3">
                          <Label
                            htmlFor="email-forgot"
                            className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold"
                          >
                            Email
                          </Label>
                          <Input
                            id="email-forgot"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white/[0.02] border-white/10 focus:border-[#D1FF3D]/40 text-white h-12 rounded-none px-4 transition-all duration-300 placeholder:text-zinc-800 focus:ring-0 text-sm"
                            placeholder="identity@network.com"
                            required
                          />
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                            >
                              <AlertCircle size={12} />
                              <span>{error}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-14 rounded-none transition-all duration-500 uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2 group active:scale-[0.98]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                          ) : (
                            <>
                              Send Recovery Email{" "}
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-extralight tracking-tighter text-white">
                          Welcome Back
                        </h3>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9B5CFF]/60 font-bold">
                          Registry Identification
                        </p>
                      </div>

                      <form onSubmit={handleSignIn} className="space-y-8">
                        {/* ✅ FIXED: Only one Email field + Password field */}
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label
                              htmlFor="email-signin"
                              className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold"
                            >
                              Email
                            </Label>
                            <Input
                              id="email-signin"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="bg-white/[0.02] border-white/10 focus:border-[#D1FF3D]/40 text-white h-12 rounded-none px-4 transition-all duration-300 placeholder:text-zinc-800 focus:ring-0 text-sm"
                              placeholder="identity@network.com"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="password-signin"
                              className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold"
                            >
                              Password
                            </Label>

                            <div className="relative">
                              <Input
                                id="password-signin"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/[0.02] border-white/10 focus:border-[#D1FF3D]/40 text-white h-12 rounded-none px-4 pr-12 transition-all duration-300 placeholder:text-zinc-800 focus:ring-0 text-sm"
                                placeholder="••••••••••••"
                                required
                              />

                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                                aria-label="Toggle password visibility"
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center gap-3 text-red-400 text-[10px] bg-red-400/5 p-4 border border-red-400/10 font-mono uppercase tracking-wider"
                            >
                              <AlertCircle size={12} />
                              <span>{error}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-6">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#D1FF3D] hover:bg-white text-black font-bold h-14 rounded-none transition-all duration-500 uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2 group active:scale-[0.98]"
                          >
                            {isSubmitting ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <>
                                Enter{" "}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </Button>

                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => setTab("forgot")}
                              className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-[#D1FF3D] transition-colors font-mono"
                            >
                              Forgot access?
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
