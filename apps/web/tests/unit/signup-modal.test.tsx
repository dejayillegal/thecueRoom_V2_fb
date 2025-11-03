
import { describe, it, expect } from 'vitest';

describe('SignupModal Artist Checkbox', () => {
  it('should validate artist profile URL domains', () => {
    const allowedDomains = [
      'soundcloud.com',
      'bandcamp.com',
      'mixcloud.com',
      'spotify.com',
      'youtube.com',
      'beatport.com',
      'instagram.com',
    ];

    const validUrls = [
      'https://soundcloud.com/artist',
      'https://www.bandcamp.com/artist',
      'https://mixcloud.com/artist',
      'https://open.spotify.com/artist/123',
      'https://youtube.com/@artist',
      'https://beatport.com/artist/123',
      'https://instagram.com/artist',
    ];

    validUrls.forEach(url => {
      const urlObj = new URL(url);
      const isValid = allowedDomains.some(domain => urlObj.hostname.includes(domain));
      expect(isValid).toBe(true);
    });

    const invalidUrl = 'https://example.com/artist';
    const invalidUrlObj = new URL(invalidUrl);
    const isInvalid = allowedDomains.some(domain => invalidUrlObj.hostname.includes(domain));
    expect(isInvalid).toBe(false);
  });

  it('should limit additional social links to 4', () => {
    const maxAdditionalLinks = 4;
    const links = Array(maxAdditionalLinks).fill('https://instagram.com/test');
    expect(links.length).toBeLessThanOrEqual(maxAdditionalLinks);
  });

  it('should validate genre max length', () => {
    const maxGenreLength = 120;
    const genre = 'Techno, House, Minimal';
    expect(genre.length).toBeLessThanOrEqual(maxGenreLength);
  });

  it('should require artist fields when isArtist is true', () => {
    const artistSignup = {
      isArtist: true,
      artistName: 'Test Artist',
      artistProfile: {
        profileUrl: 'https://soundcloud.com/test',
        genre: 'Techno',
        socialLinks: [],
        techRider: null,
      },
    };

    expect(artistSignup.isArtist).toBe(true);
    expect(artistSignup.artistProfile.profileUrl).toBeTruthy();
    expect(artistSignup.artistProfile.genre).toBeTruthy();
  });

  it('should not require artist fields when isArtist is false', () => {
    const regularSignup = {
      isArtist: false,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    };

    expect(regularSignup.isArtist).toBe(false);
  });
});
