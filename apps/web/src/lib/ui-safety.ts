/**
 * UI Safety Utilities for SSR-safe operations
 */

/**
 * Check if code is running in browser environment
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely get item from localStorage with SSR guard
 * @param key - localStorage key
 * @param defaultValue - default value if key doesn't exist or SSR
 * @returns stored value or default
 */
export function safeLocalStorageGet(key: string, defaultValue: string = ''): string {
  if (!isClient()) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (error) {
    console.warn(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Safely set item in localStorage with SSR guard
 * @param key - localStorage key
 * @param value - value to store
 * @returns success status
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!isClient()) return false;
  
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Safely remove item from localStorage with SSR guard
 * @param key - localStorage key
 * @returns success status
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (!isClient()) return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove from localStorage (${key}):`, error);
    return false;
  }
}
