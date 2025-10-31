'use client';

import { Check, X } from 'lucide-react';
import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
  confirmPassword?: string;
}

export function PasswordStrength({ password, confirmPassword }: PasswordStrengthProps) {
  const checks = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasMaxLength = password.length <= 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password);
    const passwordsMatch = confirmPassword !== undefined ? password === confirmPassword && password.length > 0 : null;

    return {
      minLength: { passed: hasMinLength, text: 'At least 8 characters' },
      maxLength: { passed: hasMaxLength, text: 'Maximum 128 characters' },
      upperCase: { passed: hasUpperCase, text: 'One uppercase letter (A-Z)' },
      lowerCase: { passed: hasLowerCase, text: 'One lowercase letter (a-z)' },
      number: { passed: hasNumber, text: 'One number (0-9)' },
      specialChar: { passed: hasSpecialChar, text: 'One special character (!@#$%^&*)' },
      match: passwordsMatch !== null ? { passed: passwordsMatch, text: 'Passwords match' } : null,
    };
  }, [password, confirmPassword]);

  const strength = useMemo(() => {
    const { match, maxLength, ...mainChecks } = checks;
    const passedCount = Object.values(mainChecks).filter(c => c.passed).length;
    
    if (passedCount <= 2) return { level: 'weak', color: 'bg-red-500', width: '25%' };
    if (passedCount <= 4) return { level: 'medium', color: 'bg-yellow-500', width: '50%' };
    if (passedCount === 5) return { level: 'good', color: 'bg-blue-500', width: '75%' };
    return { level: 'strong', color: 'bg-green-500', width: '100%' };
  }, [checks]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Password strength:</span>
          <span className="text-xs font-semibold capitalize text-foreground">{strength.level}</span>
        </div>
        <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: strength.width }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {Object.entries(checks).map(([key, check]) => {
          if (check === null) return null;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              {check.passed ? (
                <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={check.passed ? 'text-green-500' : 'text-muted-foreground'}>
                {check.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
