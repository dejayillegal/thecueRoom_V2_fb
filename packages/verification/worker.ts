#!/usr/bin/env node
import { getDbClient } from '../db/client';
import { verificationJobs, users, verificationTasks, notifications } from '../db/schema';
import { eq } from 'drizzle-orm';
import { safeFetch, extractSocialSignals, scoreSignals } from './utils';
import * as fs from 'fs';
import * as path from 'path';

const TEST_MODE = process.env.TEST_MODE === 'true';
const VERIF_CONCURRENCY = parseInt(process.env.VERIF_CONCURRENCY || '2');
const AI_TEMP_DIR = process.env.AI_TEMP_DIR || '/tmp/thecueroom-ai';

console.log('[Verification Worker] Starting...');
console.log('[Verification Worker] Test Mode:', TEST_MODE);
console.log('[Verification Worker] Concurrency:', VERIF_CONCURRENCY);
console.log('[Verification Worker] Temp Dir:', AI_TEMP_DIR);

const VERIFICATION_DIR = path.join(AI_TEMP_DIR, 'verification');
fs.mkdirSync(VERIFICATION_DIR, { recursive: true });

interface VerificationJob {
  id: string;
  userId: string;
  profileUrl: string;
  status: string;
}

async function processJob(job: VerificationJob) {
  const db = getDbClient();
  const jobStartTime = Date.now();
  
  try {
    console.log(`[Worker] Processing job ${job.id} for user ${job.userId}`);
    
    await db
      .update(verificationJobs)
      .set({ status: 'processing', progress: 10 })
      .where(eq(verificationJobs.id, job.id));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, job.userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    await db
      .update(verificationJobs)
      .set({ progress: 30 })
      .where(eq(verificationJobs.id, job.id));

    let decision: string;
    let score: number;
    let evidence: any;
    let reasons: string[];

    if (TEST_MODE) {
      console.log(`[Worker] TEST_MODE: Using deterministic verification for ${user.email}`);
      
      if (user.email.includes('test') || user.email.includes('verified')) {
        decision = 'verified_ai';
        score = 85;
        reasons = ['TEST_MODE: Auto-verified test account'];
      } else if (user.email.includes('pending')) {
        decision = 'pending_admin';
        score = 55;
        reasons = ['TEST_MODE: Pending admin review'];
      } else {
        decision = 'verified_ai';
        score = 75;
        reasons = ['TEST_MODE: Default verification'];
      }
      
      evidence = {
        testMode: true,
        profileUrl: job.profileUrl,
        timestamp: new Date().toISOString(),
      };
    } else {
      console.log(`[Worker] Fetching profile: ${job.profileUrl}`);
      
      await db
        .update(verificationJobs)
        .set({ progress: 50 })
        .where(eq(verificationJobs.id, job.id));

      const fetchResult = await safeFetch(job.profileUrl);
      
      if (!fetchResult.ok) {
        throw new Error(`Failed to fetch profile: ${fetchResult.error || fetchResult.status}`);
      }

      await db
        .update(verificationJobs)
        .set({ progress: 70 })
        .where(eq(verificationJobs.id, job.id));

      const artistName = user.username || 'artist';
      const signals = extractSocialSignals(job.profileUrl, fetchResult.text, artistName);
      const result = scoreSignals([signals]);
      
      decision = result.decision;
      score = result.score;
      reasons = result.reasons;
      evidence = { signals, fetchStatus: fetchResult.status };
    }

    await db
      .update(verificationJobs)
      .set({ progress: 90 })
      .where(eq(verificationJobs.id, job.id));

    const completedAt = new Date();
    
    await db
      .update(verificationJobs)
      .set({
        status: 'completed',
        decision,
        score,
        evidence,
        reviewNotes: reasons.join('; '),
        completedAt,
        progress: 100,
      })
      .where(eq(verificationJobs.id, job.id));

    if (decision === 'verified_ai') {
      await db
        .update(users)
        .set({
          verified: true,
          verificationStatus: 'verified_ai',
          verificationNotes: reasons.join('; '),
        })
        .where(eq(users.id, job.userId));

      await db.insert(notifications).values({
        userId: job.userId,
        type: 'verification_approved',
        title: 'Profile Verified!',
        message: 'Your profile has been automatically verified. Welcome to thecueRoom!',
        link: '/dashboard',
      });
      
      console.log(`[Worker] ✅ Job ${job.id} completed: VERIFIED (score: ${score})`);
    } else if (decision === 'pending_admin') {
      await db
        .update(users)
        .set({
          verificationStatus: 'pending_admin',
          verificationNotes: reasons.join('; '),
        })
        .where(eq(users.id, job.userId));

      await db.insert(verificationTasks).values({
        userId: job.userId,
        jobId: job.id,
        status: 'pending',
        priority: 'normal',
        notes: reasons.join('; '),
      });

      await db.insert(notifications).values({
        userId: job.userId,
        type: 'verification_pending',
        title: 'Verification Pending',
        message: 'Your profile is being reviewed by our team. You\'ll be notified once approved.',
        link: '/dashboard',
      });
      
      console.log(`[Worker] ⏳ Job ${job.id} completed: PENDING ADMIN (score: ${score})`);
    } else {
      await db
        .update(users)
        .set({
          verificationStatus: 'rejected_ai',
          verificationNotes: reasons.join('; '),
        })
        .where(eq(users.id, job.userId));

      await db.insert(notifications).values({
        userId: job.userId,
        type: 'verification_denied',
        title: 'Verification Update',
        message: `We couldn't automatically verify your profile. ${reasons.join(' ')} Please update your social links and try again.`,
        link: '/dashboard/settings',
      });
      
      console.log(`[Worker] ❌ Job ${job.id} completed: REJECTED (score: ${score})`);
    }

    const jobMetadata = {
      jobId: job.id,
      userId: job.userId,
      decision,
      score,
      reasons,
      evidence,
      duration: Date.now() - jobStartTime,
      completedAt: completedAt.toISOString(),
    };
    
    const metadataPath = path.join(VERIFICATION_DIR, `${job.id}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(jobMetadata, null, 2));
    
  } catch (error) {
    console.error(`[Worker] ❌ Job ${job.id} failed:`, error);
    
    await db
      .update(verificationJobs)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 100,
      })
      .where(eq(verificationJobs.id, job.id));
  }
}

async function pollJobs() {
  const db = getDbClient();
  
  try {
    const queuedJobs = await db
      .select()
      .from(verificationJobs)
      .where(eq(verificationJobs.status, 'queued'))
      .limit(VERIF_CONCURRENCY);

    if (queuedJobs.length > 0) {
      console.log(`[Worker] Found ${queuedJobs.length} queued job(s)`);
      
      await Promise.all(queuedJobs.map(job => processJob(job as VerificationJob)));
    }
  } catch (error) {
    console.error('[Worker] Poll error:', error);
  }
}

async function run() {
  console.log('[Worker] Starting polling loop...');
  
  setInterval(pollJobs, 5000);
  
  await pollJobs();
}

run().catch(error => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
