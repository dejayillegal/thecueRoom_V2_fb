
'use client';

import { useState } from 'react';
import AuthModal from '@/src/components/Auth/AuthModal';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function AuthButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        className="bg-[#D1FF3D] hover:bg-[#D1FF3D]/90 text-black text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] px-4 sm:px-6 h-8 sm:h-10 rounded-none transition-all duration-300"
      >
        Entrance
      </Button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
