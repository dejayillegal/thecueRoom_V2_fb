'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take the last digit
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    const newOtpString = newOtp.join('');
    if (newOtpString.length === length) {
        onComplete(newOtpString);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasteData) {
        const newOtp = Array(length).fill('');
        for(let i=0; i<pasteData.length; i++) {
            newOtp[i] = pasteData[i];
        }
        setOtp(newOtp);
        const newOtpString = newOtp.join('');
        if (newOtpString.length === length) {
            onComplete(newOtpString);
        }
        const nextFocusIndex = Math.min(pasteData.length, length - 1);
        inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="otp-box"
        />
      ))}
    </div>
  );
};
