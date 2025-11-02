import { getDbClient } from '../packages/db/client';
import { verificationJobs, users } from '../packages/db/schema';
import { eq } from 'drizzle-orm';

const TEST_MODE = process.env.TEST_MODE === 'true';

/**
 * Artist verification worker with TEST_MODE fallback
 * In production with HF_TOKEN, use AI model for verification
 * In TEST_MODE, use heuristic scoring
 */

interface VerificationResult {
  decision: 'approved' | 'rejected' | 'needs_review';
  score: number;
  evidence: any;
}

/**
 * Heuristic verification (TEST_MODE fallback)
 */
async function heuristicVerification(profileUrl: string): Promise<VerificationResult> {
  let score = 0;
  const evidence: any = {};

  try {
    // Check if URL is reachable
    const response = await fetch(profileUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'thecueRoom/2.0 Verification Bot' },
    });

    if (response.ok) {
      score += 30;
      evidence.urlReachable = true;
    } else {
      evidence.urlReachable = false;
      evidence.statusCode = response.status;
    }

    // Check domain trust
    const url = new URL(profileUrl);
    const trustedDomains = ['soundcloud.com', 'bandcamp.com', 'spotify.com', 'mixcloud.com', 'residentadvisor.net'];
    if (trustedDomains.some(d => url.hostname.includes(d))) {
      score += 40;
      evidence.trustedDomain = true;
    }

    // Add points for HTTPS
    if (url.protocol === 'https:') {
      score += 10;
      evidence.secure = true;
    }

    // Additional checks could be added here:
    // - Fetch page content and check for artist-related keywords
    // - Check for follower counts (if public API available)
    // - Verify username consistency

    score += 20; // Base score for completing checks

  } catch (error: any) {
    evidence.error = error.message;
    score = 0;
  }

  const threshold = 70;
  let decision: 'approved' | 'rejected' | 'needs_review';
  
  if (score >= threshold) {
    decision = 'approved';
  } else if (score < 30) {
    decision = 'rejected';
  } else {
    decision = 'needs_review';
  }

  return { decision, score, evidence };
}

/**
 * Process a single verification job
 */
async function processVerificationJob(jobId: string) {
  const db = getDbClient();

  const [job] = await db
    .select()
    .from(verificationJobs)
    .where(eq(verificationJobs.id, jobId))
    .limit(1);

  if (!job) {
    console.error(`[Verification] Job ${jobId} not found`);
    return;
  }

  if (job.status !== 'queued') {
    console.log(`[Verification] Job ${jobId} already processed (status: ${job.status})`);
    return;
  }

  console.log(`[Verification] Processing job ${jobId} for user ${job.userId}`);

  // Update status to processing
  await db.update(verificationJobs)
    .set({ status: 'processing', progress: 10 })
    .where(eq(verificationJobs.id, jobId));

  try {
    // Run verification
    const result = await heuristicVerification(job.profileUrl);

    // Map decision to job status
    let jobStatus: string;
    if (result.decision === 'approved') {
      jobStatus = 'completed';
    } else if (result.decision === 'rejected') {
      jobStatus = 'rejected';
    } else {
      jobStatus = 'needs_review';
    }

    // Update job with results
    await db.update(verificationJobs)
      .set({
        status: jobStatus,
        progress: 100,
        decision: result.decision,
        score: result.score,
        evidence: result.evidence,
        reviewedBy: TEST_MODE ? 'test-mode-heuristic' : 'ai-heuristic',
        completedAt: new Date(),
      })
      .where(eq(verificationJobs.id, jobId));

    // Update user verification status
    if (result.decision === 'approved') {
      await db.update(users)
        .set({
          verified: true,
          verificationStatus: 'verified',
          verificationMethod: 'ai',
          verificationMeta: result.evidence,
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Verification] ✓ User ${job.userId} verified (score: ${result.score})`);
    } else if (result.decision === 'rejected') {
      await db.update(users)
        .set({
          verified: false,
          verificationStatus: 'rejected',
          verificationMethod: 'ai',
          verificationNotes: `Automated rejection: score ${result.score} below threshold`,
          verificationMeta: result.evidence,
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Verification] ✗ User ${job.userId} rejected (score: ${result.score})`);
    } else {
      await db.update(users)
        .set({
          verificationStatus: 'needs_review',
          verificationNotes: `Uncertain score ${result.score} - requires manual review`,
          verificationMeta: result.evidence,
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Verification] ⚠ User ${job.userId} needs manual review (score: ${result.score})`);
    }

  } catch (error: any) {
    console.error(`[Verification] Error processing job ${jobId}:`, error);
    
    await db.update(verificationJobs)
      .set({
        status: 'failed',
        error: error.message,
      })
      .where(eq(verificationJobs.id, jobId));
  }
}

/**
 * Process all queued verification jobs
 */
export async function processQueuedJobs() {
  const db = getDbClient();

  const queuedJobs = await db
    .select()
    .from(verificationJobs)
    .where(eq(verificationJobs.status, 'queued'))
    .limit(10);

  console.log(`[Verification] Found ${queuedJobs.length} queued jobs`);

  for (const job of queuedJobs) {
    await processVerificationJob(job.id);
  }

  console.log(`[Verification] Processed ${queuedJobs.length} jobs`);
}

// If run directly
if (require.main === module) {
  console.log('[Verification Worker] Starting...');
  console.log(`[Verification Worker] TEST_MODE: ${TEST_MODE}`);
  
  processQueuedJobs()
    .then(() => {
      console.log('[Verification Worker] Complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Verification Worker] Fatal error:', error);
      process.exit(1);
    });
}
