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

  if (user.email.includes('temp') || user.email.includes('disposable') || user.email.includes('test')) {
    suspicious = true;
    indicators.push('Suspicious email pattern (temp/disposable)');
  }

  if (!profile.firstName || !profile.lastName || profile.firstName.length < 2) {
    suspicious = true;
    indicators.push('Incomplete name information');
  }

  if (!profile.socialProfileUrl || profile.socialProfileUrl.length < 10) {
    suspicious = true;
    indicators.push('Missing or invalid social profile URL');
  }

  if (!profile.region || !profile.genre) {
    suspicious = true;
    indicators.push('Missing required profile fields');
  }

  const genericUsernames = ['user', 'test', 'admin', 'default', 'temp'];
  if (genericUsernames.some(g => user.username.toLowerCase().includes(g))) {
    suspicious = true;
    indicators.push('Generic or test username pattern');
  }

  if (profileHtml) {
    const hasMinimalContent = profileHtml.length < 1000;
    if (hasMinimalContent) {
      indicators.push('Social profile has minimal content');
    }
  }

  return {
    suspicious,
    indicators: suspicious ? indicators : undefined,
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
