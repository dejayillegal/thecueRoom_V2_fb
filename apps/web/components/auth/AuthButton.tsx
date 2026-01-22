
'use client';

import { useState } from 'react';
import AuthModal from '../Auth/AuthModal';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function AuthButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="bg-white/5 hover:bg-[#D1FF3D]/10 text-[#D1FF3D] border border-[#D1FF3D]/10 hover:border-[#D1FF3D]/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.5em] px-3 sm:px-5 h-7 sm:h-8 rounded-none transition-all duration-500 font-mono"
      >
        Entrance
      </Button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
