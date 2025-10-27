'use client';

import { useState } from 'react';
import { AuthModal } from './SignInModal';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        className="bg-primary hover:bg-primary/90 text-sm"
      >
        Sign In / Sign Up
      </Button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}