export interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
  error?: string;
}

export async function safeFetch(url: string, timeoutMs = 20000): Promise<FetchResult> {
  try {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'thecueRoom-Verification/1.0',
      },
    });

    globalThis.clearTimeout(timeoutId);

    const text = await response.text();
    
    return {
      ok: response.ok,
      status: response.status,
      text: text.substring(0, 100000), // Limit to 100KB
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 0,
      text: '',
      error: error.message || 'Fetch failed',
    };
  }
}

export interface SocialSignals {
  platform?: string;
  hasArtistName: boolean;
  hasProfile: boolean;
  hasReleases: boolean;
  hasFollowers: boolean;
  hasRecentActivity: boolean;
  confidence: number;
}

const KNOWN_PLATFORMS = [
  { domain: 'soundcloud.com', name: 'SoundCloud' },
  { domain: 'instagram.com', name: 'Instagram' },
  { domain: 'bandcamp.com', name: 'Bandcamp' },
  { domain: 'spotify.com', name: 'Spotify' },
  { domain: 'mixcloud.com', name: 'Mixcloud' },
  { domain: 'beatport.com', name: 'Beatport' },
  { domain: 'residentadvisor.net', name: 'Resident Advisor' },
  { domain: 'youtube.com', name: 'YouTube' },
];

export function extractSocialSignals(url: string, html: string, artistName: string): SocialSignals {
  const lowerHtml = html.toLowerCase();
  const lowerArtistName = artistName.toLowerCase();
  const urlLower = url.toLowerCase();
  
  const platform = KNOWN_PLATFORMS.find(p => urlLower.includes(p.domain));
  
  const hasArtistName = lowerHtml.includes(lowerArtistName) ||
                        urlLower.includes(lowerArtistName.replace(/\s+/g, ''));
  
  const profileIndicators = ['profile', 'artist', 'musician', 'dj', 'producer', 'bio'];
  const hasProfile = profileIndicators.some(ind => lowerHtml.includes(ind));
  
  const releaseIndicators = ['track', 'release', 'album', 'ep', 'single', 'playlist', 'mix'];
  const hasReleases = releaseIndicators.some(ind => lowerHtml.includes(ind));
  
  const followerIndicators = ['follower', 'subscriber', 'fan', 'listener'];
  const hasFollowers = followerIndicators.some(ind => lowerHtml.includes(ind));
  
  const activityIndicators = ['ago', 'recent', 'new', 'latest', '2024', '2025'];
  const hasRecentActivity = activityIndicators.some(ind => lowerHtml.includes(ind));
  
  const confidence = [
    platform ? 30 : 0,
    hasArtistName ? 25 : 0,
    hasProfile ? 15 : 0,
    hasReleases ? 15 : 0,
    hasFollowers ? 10 : 0,
    hasRecentActivity ? 5 : 0,
  ].reduce((a, b) => a + b, 0);
  
  return {
    platform: platform?.name,
    hasArtistName,
    hasProfile,
    hasReleases,
    hasFollowers,
    hasRecentActivity,
    confidence,
  };
}

export function scoreSignals(signals: SocialSignals[]): { score: number; decision: string; reasons: string[] } {
  const reasons: string[] = [];
  const avgConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / Math.max(signals.length, 1);
  
  const platformCount = signals.filter(s => s.platform).length;
  const artistNameCount = signals.filter(s => s.hasArtistName).length;
  const releasesCount = signals.filter(s => s.hasReleases).length;
  
  if (platformCount > 0) {
    reasons.push(`Found ${platformCount} recognized platform(s)`);
  }
  
  if (artistNameCount > 0) {
    reasons.push(`Artist name appears in ${artistNameCount} link(s)`);
  }
  
  if (releasesCount > 0) {
    reasons.push(`Release indicators found in ${releasesCount} link(s)`);
  }
  
  const score = Math.min(100, avgConfidence);
  
  let decision = 'pending_admin';
  if (score >= 70) {
    decision = 'verified_ai';
    reasons.push('High confidence verification');
  } else if (score >= 40) {
    decision = 'pending_admin';
    reasons.push('Medium confidence - requires admin review');
  } else {
    decision = 'rejected_ai';
    reasons.push('Low confidence - insufficient evidence');
  }
  
  return { score, decision, reasons };
}
