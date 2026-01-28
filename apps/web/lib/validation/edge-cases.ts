
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 1000);
}

import { validateEmail as validateEmailCentral, isValidEmail as isValidEmailCentral } from './email';

export function validateEmail(email: string): boolean {
  return isValidEmailCentral(email);
}

export { validateEmailCentral as validateEmailFull, isValidEmailCentral as isValidEmail };

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateArtistName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { valid: false, error: 'Artist name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Artist name must not exceed 100 characters' };
  }
  
  // Check for emoji-only names
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  if (emojiRegex.test(name)) {
    return { valid: false, error: 'Artist name cannot contain only emojis' };
  }
  
  return { valid: true };
}

export function validateSocialLinks(links: string[]): { valid: boolean; error?: string } {
  if (links.length > 5) {
    return { valid: false, error: 'Maximum 5 social links allowed' };
  }
  
  for (const link of links) {
    if (!validateUrl(link)) {
      return { valid: false, error: 'All social links must be valid URLs' };
    }
  }
  
  return { valid: true };
}

export function rateLimitCheck(
  attempts: number,
  maxAttempts: number = 5,
  windowMs: number = 900000 // 15 minutes
): boolean {
  return attempts < maxAttempts;
}
