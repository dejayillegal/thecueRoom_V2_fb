'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Loader2, Sparkles, Shield, User } from 'lucide-react';
import AuthModal from './Auth/AuthModal';

export default function EntranceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    // Show after 1.5 seconds if not seen before
    const hasSeen = localStorage.getItem('entrance_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('entrance_seen', 'true');
    setIsOpen(false);
  };

  const handleAuth = () => {
    setIsAuthOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0B0B0B] border border-white/5 p-12 overflow-hidden"
            >
              {/* Abstract Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D1FF3D]/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
              
              <div className="relative space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-[#D1FF3D]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-[#D1FF3D]">Initial Access</span>
                  </div>
                  <h2 className="text-5xl font-extralight tracking-tighter leading-tight">
                    Establish Your <br />
                    <span className="italic">Identity</span>
                  </h2>
                  <p className="text-sm text-white/40 font-light leading-relaxed max-w-xs">
                    Join the central hub for music signals, creative tools, and underground discourse.
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleAuth}
                    className="group w-full bg-[#D1FF3D] hover:bg-white text-black h-16 flex items-center justify-between px-8 transition-all duration-500"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Initialize Gateway</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full h-16 flex items-center justify-center text-[10px] font-mono uppercase tracking-[0.4em] text-white/20 hover:text-white transition-colors"
                  >
                    Continue as Guest
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5 flex justify-between">
                  <div className="flex gap-4">
                    <Shield size={12} className="text-[#D1FF3D]/40" />
                    <User size={12} className="text-[#D1FF3D]/40" />
                    <Sparkles size={12} className="text-[#D1FF3D]/40" />
                  </div>
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/10 italic">Secure Protocol V2.0</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
