'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack?: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send reset email');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <p className="text-xs text-gray-400">
                Didn't receive it? Check your spam folder or try again in a few minutes.
              </p>
            </div>
          </div>
        </div>

        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-lime-400/30 text-lime-400 hover:bg-lime-400/10"
          >
            Back to Sign In
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <p className="text-sm text-gray-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div>
        <Label htmlFor="reset-email" className="text-gray-300">
          Email
        </Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@artistmail.com"
          className="bg-gray-900 border-gray-700 text-white mt-1.5"
          required
          autoComplete="email"
        />
      </div>

      {error && (
        <div 
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        {onBack && (
          <Button
            type="button"
            onClick={onBack}
            variant="ghost"
            className="flex-1 border-gray-700 text-gray-300"
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-lime-400 text-black hover:bg-lime-500 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Reset Link
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
