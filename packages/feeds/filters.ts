import { NormalizedEvent } from './types';

/**
 * Bollywood/pop blacklist pattern
 */
const BOLLYWOOD_PATTERN = /bollywood|film|movie|celebrity|awards?|premiere|cricket|pop\s*music|mainstream/i;

/**
 * Underground electronic genres we want to keep
 */
const UNDERGROUND_GENRES = [
  'techno',
  'house',
  'electronic',
  'minimal',
  'tech-house',
  'tech house',
  'deep house',
  'drum and bass',
  'bass',
  'dubstep',
  'trance',
  'progressive',
  'experimental',
  'ambient',
  'idm',
  'breakbeat',
  'jungle',
  'garage',
  'dnb',
  'd&b',
];

/**
 * Filter out Bollywood and mainstream events
 */
export function filterBollywood(event: NormalizedEvent): boolean {
  // Check title and description for blacklisted keywords
  const textToCheck = `${event.title} ${event.description || ''}`.toLowerCase();
  
  if (BOLLYWOOD_PATTERN.test(textToCheck)) {
    return false;
  }

  // If genres are specified, check if any match underground genres
  if (event.genres && event.genres.length > 0) {
    const hasUndergroundGenre = event.genres.some(genre => 
      UNDERGROUND_GENRES.some(ug => genre.toLowerCase().includes(ug))
    );
    
    // Keep events with underground genres
    if (hasUndergroundGenre) {
      return true;
    }
  }

  // Check if title/description mentions underground genres
  const mentionsUnderground = UNDERGROUND_GENRES.some(genre =>
    textToCheck.includes(genre.toLowerCase())
  );

  return mentionsUnderground;
}

/**
 * Normalize genres to lowercase and common variants
 */
export function normalizeGenres(genres: string[]): string[] {
  return genres
    .map(g => g.toLowerCase().trim())
    .map(g => {
      // Map common variants
      if (g.includes('tech house') || g.includes('tech-house')) return 'tech-house';
      if (g.includes('deep house')) return 'deep-house';
      if (g.includes('drum and bass') || g.includes('drum & bass') || g === 'dnb' || g === 'd&b') return 'drum-and-bass';
      return g;
    })
    .filter((g, i, arr) => arr.indexOf(g) === i); // unique
}
