
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
        className="bg-primary hover:bg-primary/90 text-sm font-semibold gap-2"
      >
        <LogIn className="w-4 h-4" />
        Sign In / Sign Up
      </Button>
      <AuthModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
