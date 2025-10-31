'use client';

import { useEffect, useRef } from 'react';

export function useFormDraft<T extends Record<string, any>>(
  key: string,
  data: T,
  enabled: boolean = true,
  intervalMs: number = 5000
) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const loadDraft = () => {
      try {
        const saved = localStorage.getItem(`draft_${key}`);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
      return null;
    };

    const initialDraft = loadDraft();
    if (initialDraft) {
      Object.assign(data, initialDraft);
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`draft_${key}`, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, intervalMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [key, data, enabled, intervalMs]);

  const clearDraft = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`draft_${key}`);
      } catch (error) {
        console.error('Failed to clear draft:', error);
      }
    }
  };

  return { clearDraft };
}
