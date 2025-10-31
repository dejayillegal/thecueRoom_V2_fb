import { getDbClient } from '@thecueroom/db/client';
import { users, profiles, verificationJobs } from '@thecueroom/db/schema';
import { eq, and, ne, or } from 'drizzle-orm';

export interface VerificationResult {
  decision: 'approved' | 'rejected' | 'review';
  score: number;
  evidence: {
    profileAnalysis: string;
    duplicateCheck: {
      found: boolean;
      matches?: string[];
      reason?: string;
    };
    fakeAccountIndicators: {
      suspicious: boolean;
      indicators?: string[];
    };
    aiReasoning: string;
  };
  requiresManualReview: boolean;
  adminMessage?: string;
}

export async function verifyUserProfile(
  userId: string,
  profileUrl: string,
  profileHtml?: string
): Promise<VerificationResult> {
  const db = getDbClient();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw new Error('User not found');
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error('Profile not found');
  }

  const duplicateCheck = await checkForDuplicates(user, profile, db);

  const fakeAccountCheck = await analyzeFakeAccountIndicators(
    user,
    profile,
    profileUrl,
    profileHtml
  );

  let score = 50;

  if (duplicateCheck.found) {
    score -= 40;
  }

  if (fakeAccountCheck.suspicious) {
    score -= 30;
  }

  if (profile.socialProfileUrl && profile.socialProfileUrl.length > 10) {
    score += 20;
  }

  if (user.email && !user.email.includes('temp') && !user.email.includes('disposable')) {
    score += 10;
  }

  const hasRecentCreation = new Date(user.createdAt).getTime() > Date.now() - 60000;
  if (!hasRecentCreation) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  let decision: 'approved' | 'rejected' | 'review' = 'review';
  let requiresManualReview = false;
  let adminMessage: string | undefined;

  if (score >= 70 && !duplicateCheck.found && !fakeAccountCheck.suspicious) {
    decision = 'approved';
  } else if (score < 30 || duplicateCheck.found) {
    decision = 'rejected';
    if (duplicateCheck.found) {
      adminMessage = `Duplicate account detected. Matches: ${duplicateCheck.matches?.join(', ')}`;
      requiresManualReview = true;
    }
  } else {
    decision = 'review';
    requiresManualReview = true;
    adminMessage = `Manual review required. Score: ${score}. ${
      fakeAccountCheck.suspicious ? 'Fake account indicators detected.' : ''
    }`;
  }

  return {
    decision,
    score,
    evidence: {
      profileAnalysis: `Profile score: ${score}/100`,
      duplicateCheck,
      fakeAccountIndicators: fakeAccountCheck,
      aiReasoning: `Account ${decision} based on duplicate check, fake account analysis, and profile completeness.`,
    },
    requiresManualReview,
    adminMessage,
  };
}

async function checkForDuplicates(user: any, profile: any, db: any) {
  const matches: string[] = [];
  let found = false;
  let reason = '';

  const emailMatches = await db
    .select()
    .from(users)
    .where(and(eq(users.email, user.email), ne(users.id, user.id)))
    .limit(5);

  if (emailMatches.length > 0) {
    found = true;
    matches.push(`${emailMatches.length} account(s) with same email`);
    reason = 'Duplicate email detected';
  }

  const similarProfiles = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.displayName, profile.displayName),
        ne(profiles.userId, user.id)
      )
    )
    .limit(5);

  if (similarProfiles.length > 0) {
    found = true;
    matches.push(`${similarProfiles.length} profile(s) with same artist name`);
    if (!reason) reason = 'Duplicate artist name detected';
  }

  if (profile.socialProfileUrl) {
    const sameUrlProfiles = await db
      .select()
      .from(profiles)
      .where(
        and(
          eq(profiles.socialProfileUrl, profile.socialProfileUrl),
          ne(profiles.userId, user.id)
        )
      )
      .limit(5);

    if (sameUrlProfiles.length > 0) {
      found = true;
      matches.push(`${sameUrlProfiles.length} profile(s) with same social URL`);
      if (!reason) reason = 'Duplicate social profile URL detected';
    }
  }

  return {
    found,
    matches: found ? matches : undefined,
    reason: found ? reason : undefined,
  };
}

async function analyzeFakeAccountIndicators(
  user: any,
  profile: any,
  profileUrl: string,
  profileHtml?: string
) {
  const indicators: string[] = [];
  let suspicious = false;
  let suspicionScore = 0;

  // Email validation - disposable/temp email services
  const disposableEmailPatterns = [
    'temp', 'disposable', 'test', 'fake', 'throwaway', 'guerrilla',
    'mailinator', 'yopmail', '10minutemail', 'tempmail'
  ];
  if (disposableEmailPatterns.some(pattern => user.email.toLowerCase().includes(pattern))) {
    suspicious = true;
    suspicionScore += 25;
    indicators.push('Disposable or temporary email service detected');
  }

  // Email pattern analysis - sequential numbers or random chars
  if (/\d{6,}/.test(user.email)) {
    suspicionScore += 15;
    indicators.push('Email contains suspicious number sequence');
  }

  // Name validation - incomplete or suspicious patterns
  if (!profile.firstName || !profile.lastName) {
    suspicionScore += 20;
    indicators.push('Missing first or last name');
  } else {
    // Check for single character names
    if (profile.firstName.length < 2 || profile.lastName.length < 2) {
      suspicionScore += 15;
      indicators.push('Name too short (possible fake)');
    }

    // Check for keyboard spam patterns
    const keyboardSpamPatterns = ['asdf', 'qwerty', 'aaaa', 'bbbb', 'test', 'xxxx'];
    const fullName = `${profile.firstName}${profile.lastName}`.toLowerCase();
    if (keyboardSpamPatterns.some(pattern => fullName.includes(pattern))) {
      suspicionScore += 20;
      indicators.push('Name contains keyboard spam pattern');
    }

    // Check if first and last name are identical
    if (profile.firstName.toLowerCase() === profile.lastName.toLowerCase()) {
      suspicionScore += 15;
      indicators.push('First and last name are identical');
    }
  }

  // Social profile URL validation
  if (!profile.socialProfileUrl || profile.socialProfileUrl.length < 10) {
    suspicionScore += 25;
    indicators.push('Missing or invalid social profile URL');
  } else {
    // Validate URL structure
    try {
      const url = new URL(profile.socialProfileUrl);
      
      // Check for valid music/social platforms
      const validPlatforms = [
        'soundcloud.com', 'bandcamp.com', 'spotify.com', 'mixcloud.com',
        'youtube.com', 'instagram.com', 'beatport.com', 'residentadvisor.net',
        'apple.com/music', 'tidal.com', 'deezer.com'
      ];
      
      const isValidPlatform = validPlatforms.some(platform => 
        url.hostname.includes(platform)
      );
      
      if (!isValidPlatform) {
        suspicionScore += 20;
        indicators.push('Social URL is not from a recognized music platform');
      }

      // Check for suspicious URL patterns (URL shorteners, random domains)
      const suspiciousUrlPatterns = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly'];
      if (suspiciousUrlPatterns.some(pattern => url.hostname.includes(pattern))) {
        suspicionScore += 30;
        indicators.push('URL shortener or suspicious domain detected');
      }

      // Check if URL path is too short (might be homepage, not artist page)
      if (url.pathname.length < 3) {
        suspicionScore += 10;
        indicators.push('Social URL appears to be a homepage, not an artist profile');
      }
    } catch (e) {
      suspicionScore += 25;
      indicators.push('Invalid URL format');
    }
  }

  // Required profile fields validation
  if (!profile.region || !profile.genre) {
    suspicionScore += 20;
    indicators.push('Missing required profile fields (region or genre)');
  }

  // Genre validation - check for suspicious patterns
  if (profile.genre) {
    const suspiciousGenres = ['test', 'none', 'n/a', 'asdf', 'xxx'];
    if (suspiciousGenres.some(g => profile.genre.toLowerCase().includes(g))) {
      suspicionScore += 15;
      indicators.push('Suspicious genre value detected');
    }
  }

  // Username validation - generic or bot-like patterns
  const genericUsernames = ['user', 'test', 'admin', 'default', 'temp', 'bot', 'fake'];
  if (genericUsernames.some(g => user.username.toLowerCase().includes(g))) {
    suspicionScore += 20;
    indicators.push('Generic or test username pattern');
  }

  // Sequential username pattern (user123456, artist999999)
  if (/\d{5,}$/.test(user.username)) {
    suspicionScore += 15;
    indicators.push('Username ends with long number sequence (bot-like)');
  }

  // Profile HTML content analysis
  if (profileHtml) {
    // Minimal content check
    const hasMinimalContent = profileHtml.length < 1000;
    if (hasMinimalContent) {
      suspicionScore += 10;
      indicators.push('Social profile has minimal content');
    }

    // Check for error pages or "not found" indicators
    const errorIndicators = ['404', 'not found', 'page not found', 'doesn\'t exist', 'suspended', 'deleted'];
    const htmlLower = profileHtml.toLowerCase();
    if (errorIndicators.some(indicator => htmlLower.includes(indicator))) {
      suspicionScore += 35;
      indicators.push('Social profile appears to be deleted, suspended, or not found');
    }

    // Check for bot protection or CAPTCHA
    const botProtection = ['captcha', 'recaptcha', 'cloudflare', 'access denied', 'rate limit'];
    if (botProtection.some(indicator => htmlLower.includes(indicator))) {
      suspicionScore += 5;
      indicators.push('Bot protection detected (may need manual verification)');
    }

    // Check for actual music/artist content
    const musicIndicators = ['track', 'album', 'release', 'playlist', 'follower', 'play', 'listen', 'music'];
    const hasMusicContent = musicIndicators.some(indicator => htmlLower.includes(indicator));
    if (!hasMusicContent) {
      suspicionScore += 15;
      indicators.push('Profile lacks music-related content');
    }
  }

  // Artist name vs username consistency check
  if (profile.artistName && user.username) {
    const normalizedArtist = profile.artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // If they're completely different, it might be suspicious
    if (normalizedArtist.length > 3 && normalizedUsername.length > 3) {
      const similarity = normalizedUsername.includes(normalizedArtist) || 
                        normalizedArtist.includes(normalizedUsername);
      if (!similarity) {
        suspicionScore += 5;
        indicators.push('Artist name and username have no similarity');
      }
    }
  }

  // Account creation time analysis (rapid account creation might indicate bots)
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const isVeryNew = accountAge < 60000; // Less than 1 minute old
  if (isVeryNew && suspicionScore > 20) {
    suspicionScore += 10;
    indicators.push('Account created very recently (possible automated creation)');
  }

  // Set suspicious flag if score exceeds threshold
  if (suspicionScore >= 40) {
    suspicious = true;
  }

  return {
    suspicious,
    suspicionScore,
    indicators: suspicious || indicators.length > 0 ? indicators : undefined,
  };
}

export async function sendAdminNotification(
  jobId: string,
  userId: string,
  message: string
) {
  console.log('[Admin Notification]', {
    jobId,
    userId,
    message,
    timestamp: new Date().toISOString(),
  });

  const db = getDbClient();
  
  await db
    .update(verificationJobs)
    .set({
      reviewNotes: message,
      updatedAt: new Date(),
    })
    .where(eq(verificationJobs.id, jobId));
}
