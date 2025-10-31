import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet, isClient } from '@/lib/ui-safety';

/**
 * Hook for persistent boolean toggle state with localStorage
 * @param key - localStorage key (will be prefixed with 'tcr:')
 * @param defaultValue - default value when key doesn't exist
 * @returns [value, toggle function, set function]
 */
export function usePersistentToggle(
  key: string,
  defaultValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const storageKey = `tcr:${key}`;
  
  const [value, setValue] = useState<boolean>(() => {
    if (!isClient()) return defaultValue;
    
    const stored = safeLocalStorageGet(storageKey);
    if (stored === '') return defaultValue;
    
    return stored === 'true';
  });

  useEffect(() => {
    if (!isClient()) return;
    
    safeLocalStorageSet(storageKey, String(value));
  }, [value, storageKey]);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const set = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, set];
}
