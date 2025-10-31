'use client';

import { useEffect, useState, useRef } from 'react';

export function useFormDraft<T extends Record<string, any>>(
  key: string,
  initialData: T,
  enabled: boolean = true,
  intervalMs: number = 5000
) {
  const [data, setData] = useState<T>(() => {
    if (!enabled || typeof window === 'undefined') return initialData;
    
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return initialData;
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const hasData = Object.values(data).some(v => 
          Array.isArray(v) ? v.some(s => s) : v
        );
        if (hasData) {
          localStorage.setItem(`draft_${key}`, JSON.stringify(data));
        }
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

  return { data, setData, clearDraft };
}
