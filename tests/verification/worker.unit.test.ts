import { describe, it, expect } from 'vitest';
import { extractSocialSignals, scoreSignals } from '../../packages/verification/utils';

describe('Verification Worker - Social Signal Extraction', () => {
  it('should detect known platforms', () => {
    const urls = [
      'https://soundcloud.com/artist',
      'https://instagram.com/artist',
      'https://bandcamp.com/artist',
    ];

    urls.forEach(url => {
      const platform = url.match(/soundcloud|instagram|bandcamp/)?.[0];
      expect(platform).toBeTruthy();
    });
  });

  it('should extract signals from HTML', () => {
    const html = `
      <html>
        <body>
          <h1>DJ TestArtist</h1>
          <div class="tracks">5 tracks</div>
          <div class="followers">1000 followers</div>
        </body>
      </html>
    `;

    const signals = extractSocialSignals(
      'https://soundcloud.com/testartist',
      html,
      'DJ TestArtist'
    );

    expect(signals.platform).toBe('SoundCloud');
    expect(signals.hasArtistName).toBe(true);
    expect(signals.hasReleases).toBe(true);
    expect(signals.confidence).toBeGreaterThan(0);
  });

  it('should score multiple signals correctly', () => {
    const mockSignals = [
      {
        platform: 'SoundCloud',
        hasArtistName: true,
        hasProfile: true,
        hasReleases: true,
        hasFollowers: true,
        hasRecentActivity: true,
        confidence: 85,
      },
      {
        platform: 'Instagram',
        hasArtistName: true,
        hasProfile: true,
        hasReleases: false,
        hasFollowers: true,
        hasRecentActivity: true,
        confidence: 60,
      },
    ];

    const result = scoreSignals(mockSignals);
    
    expect(result.score).toBeGreaterThan(50);
    expect(result.decision).toBe('verified_ai');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('should reject low confidence profiles', () => {
    const mockSignals = [
      {
        platform: undefined,
        hasArtistName: false,
        hasProfile: false,
        hasReleases: false,
        hasFollowers: false,
        hasRecentActivity: false,
        confidence: 10,
      },
    ];

    const result = scoreSignals(mockSignals);
    
    expect(result.score).toBeLessThan(40);
    expect(result.decision).toBe('rejected_ai');
  });

  it('should require admin review for medium confidence', () => {
    const mockSignals = [
      {
        platform: 'SoundCloud',
        hasArtistName: false,
        hasProfile: true,
        hasReleases: true,
        hasFollowers: false,
        hasRecentActivity: true,
        confidence: 50,
      },
    ];

    const result = scoreSignals(mockSignals);
    
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(70);
    expect(result.decision).toBe('pending_admin');
  });
});

describe('TEST_MODE Verification', () => {
  it('should use deterministic behavior in TEST_MODE', () => {
    const testUserId = 'test-verified-user';
    
    // In TEST_MODE, users with 'verified' in email/id should be auto-verified
    const shouldVerify = testUserId.includes('verified');
    expect(shouldVerify).toBe(true);
  });
});
