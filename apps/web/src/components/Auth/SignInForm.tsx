'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignInFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export function SignInForm({ onSuccess, onForgotPassword }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Sign in failed');
        setIsSubmitting(false);
        return;
      }

      if (onSuccess) {
        onSuccess();
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-gray-300">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@artistmail.com"
          className="bg-gray-900 border-gray-700 text-white mt-1.5"
          required
          autoComplete="email"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-gray-300">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-gray-900 border-gray-700 text-white mt-1.5"
          required
          autoComplete="current-password"
        />
      </div>

      {onForgotPassword && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-lime-400 hover:text-lime-300 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      {error && (
        <div 
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-lime-400 text-black hover:bg-lime-500 font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </>
        )}
      </Button>

      <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            New: Artist profiles are AI-verified after sign-up to keep the community real.
          </p>
        </div>
      </div>
    </form>
  );
}
