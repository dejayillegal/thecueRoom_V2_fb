'use client';

import { useState } from 'react';
import { AuthModal } from './SignInModal';
import { Button } from '@/components/ui/button';

export function AuthButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Sign In / Sign Up</Button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </>
  );
}
