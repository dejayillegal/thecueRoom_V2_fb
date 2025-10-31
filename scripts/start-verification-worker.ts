import { getDbClient } from '../packages/db/client';
import { verificationJobs, users } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Environment validation
if (!process.env.DATABASE_URL) {
  console.error('[Verification Worker] ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const TEST_MODE = process.env.TEST_MODE === 'true';
const VERIFY_TEMP_DIR = process.env.VERIFY_TEMP_DIR || '/tmp/thecueroom/verify';
const CONCURRENCY = parseInt(process.env.AI_WORKER_CONCURRENCY || '1');

console.log('[Verification Worker] Starting...');
console.log('[Verification Worker] Test Mode:', TEST_MODE);
console.log('[Verification Worker] Concurrency:', CONCURRENCY);
console.log('[Verification Worker] Temp Dir:', VERIFY_TEMP_DIR);

// Ensure temp dir exists
try {
  mkdirSync(VERIFY_TEMP_DIR, { recursive: true });
} catch (err) {
  console.error('[Verification Worker] ERROR: Failed to create temp directory:', err);
  process.exit(1);
}

async function fetchProfileData(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TheCueRoomBot/1.0)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    
    // Limit HTML size
    const limitedHtml = html.substring(0, 50000);
    
    return { html: limitedHtml, status: response.status };
  } catch (error: any) {
    return { error: error.message };
  }
}

function extractSignals(html: string, url: string) {
  const signals = {
    foundAudio: false,
    foundVideo: false,
    foundReleases: false,
    followerCount: 0,
    username: '',
    bio: '',
    recentActivity: false,
  };

  // SoundCloud signals
  if (url.includes('soundcloud.com')) {
    signals.foundAudio = html.includes('SoundCloud') && 
                         (html.includes('track') || html.includes('playlist'));
    signals.foundReleases = html.includes('tracks-module') || html.includes('playlistsModule');
    
    const followerMatch = html.match(/(\d+)\s*followers?/i);
    if (followerMatch) signals.followerCount = parseInt(followerMatch[1]);
  }

  // Instagram signals
  if (url.includes('instagram.com')) {
    signals.foundVideo = html.includes('video') || html.includes('reel');
    const followerMatch = html.match(/(\d+)\s*followers?/i);
    if (followerMatch) signals.followerCount = parseInt(followerMatch[1]);
  }

  // Bandcamp signals
  if (url.includes('bandcamp.com')) {
    signals.foundAudio = html.includes('trackView') || html.includes('albumView');
    signals.foundReleases = html.includes('music-grid-item');
  }

  // General signals
  signals.recentActivity = html.includes('2024') || html.includes('2025');
  
  return signals;
}

function calculateScore(signals: any, url: string) {
  let score = 0;

  // Audio/video presence
  if (signals.foundAudio) score += 30;
  if (signals.foundVideo) score += 20;
  if (signals.foundReleases) score += 25;

  // Follower threshold
  if (signals.followerCount > 100) score += 15;
  if (signals.followerCount > 1000) score += 10;

  // Recent activity
  if (signals.recentActivity) score += 10;

  // Platform bonus
  if (url.includes('soundcloud.com') || url.includes('bandcamp.com')) {
    score += 10; // Music-first platforms
  }

  return Math.min(score, 100);
}

function makeDecision(score: number) {
  if (score >= 70) return 'approved';
  if (score >= 40) return 'review';
  return 'rejected';
}

async function processJob(jobId: string) {
  const db = getDbClient();
  
  try {
    console.log(`[Worker] Processing job ${jobId}`);
    
    // Get job
    const [job] = await db.select().from(verificationJobs).where(eq(verificationJobs.id, jobId));
    if (!job) {
      console.log(`[Worker] Job ${jobId} not found`);
      return;
    }

    // Update to processing
    await db.update(verificationJobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(verificationJobs.id, jobId));

    let decision, score, evidence;

    if (TEST_MODE) {
      // Deterministic test mode
      if (job.profileUrl.includes('test-accept')) {
        decision = 'approved';
        score = 85;
      } else if (job.profileUrl.includes('test-reject')) {
        decision = 'rejected';
        score = 20;
      } else {
        decision = 'review';
        score = 55;
      }
      
      evidence = {
        profileUrl: job.profileUrl,
        testMode: true,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Real verification with AI
      const profileData = await fetchProfileData(job.profileUrl);
      
      let profileHtml = '';
      if (!profileData.error && profileData.html) {
        profileHtml = profileData.html;
      }

      // Use AI verification for duplicate and fake account detection
      const { verifyUserProfile } = await import('../apps/web/src/lib/ai-verification');
      const aiResult = await verifyUserProfile(job.userId, job.profileUrl, profileHtml);

      decision = aiResult.decision;
      score = aiResult.score;
      evidence = aiResult.evidence;

      // Send admin notification if manual review is required
      if (aiResult.requiresManualReview && aiResult.adminMessage) {
        console.log(`[Worker] Manual review required for user ${job.userId}: ${aiResult.adminMessage}`);
        
        await db.update(verificationJobs)
          .set({
            reviewNotes: aiResult.adminMessage,
            updatedAt: new Date(),
          })
          .where(eq(verificationJobs.id, jobId));
        
        // Log admin notification (can be extended to email/Slack in future)
        writeFileSync(
          join(VERIFY_TEMP_DIR, `admin-review-${jobId}.json`),
          JSON.stringify({
            jobId,
            userId: job.userId,
            message: aiResult.adminMessage,
            timestamp: new Date().toISOString(),
            evidence: aiResult.evidence,
          }, null, 2)
        );
      }
    }

    // Update job with result
    await db.update(verificationJobs)
      .set({
        status: 'completed',
        decision,
        score,
        evidence,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationJobs.id, jobId));

    // Update user based on decision
    if (decision === 'approved') {
      await db.update(users)
        .set({
          verified: true,
          verificationStatus: 'approved',
          verificationJobId: jobId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Worker] User ${job.userId} verified and approved`);
    } else if (decision === 'rejected') {
      await db.update(users)
        .set({
          verified: false,
          verificationStatus: 'rejected',
          verificationJobId: jobId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Worker] User ${job.userId} verification rejected`);
    } else if (decision === 'review') {
      await db.update(users)
        .set({
          verified: false,
          verificationStatus: 'manual_review',
          verificationJobId: jobId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, job.userId));
      
      console.log(`[Worker] User ${job.userId} flagged for manual review`);
    }

    // Write result to file
    const resultFile = join(VERIFY_TEMP_DIR, `${jobId}.json`);
    writeFileSync(resultFile, JSON.stringify({ jobId, decision, score, evidence }, null, 2));

    console.log(`[Worker] Job ${jobId} completed: ${decision} (score: ${score})`);
  } catch (error: any) {
    console.error(`[Worker] Job ${jobId} failed:`, error);
    
    await db.update(verificationJobs)
      .set({
        status: 'failed',
        error: error.message,
        updatedAt: new Date(),
      })
      .where(eq(verificationJobs.id, jobId));
  }
}

async function processQueue() {
  const queueFile = join(VERIFY_TEMP_DIR, 'queue.jsonl');
  
  if (!existsSync(queueFile)) {
    return;
  }

  try {
    const content = readFileSync(queueFile, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    // Clear queue file
    writeFileSync(queueFile, '');

    for (const line of lines) {
      try {
        const { jobId } = JSON.parse(line);
        await processJob(jobId);
      } catch (err) {
        console.error('[Worker] Queue entry error:', err);
      }
    }
  } catch (error) {
    console.error('[Worker] Queue processing error:', error);
  }
}

// Poll for jobs
async function run() {
  console.log('[Worker] Starting polling loop...');
  
  while (true) {
    await processQueue();
    
    // Check for pending jobs in DB
    const db = getDbClient();
    const pendingJobs = await db.select()
      .from(verificationJobs)
      .where(eq(verificationJobs.status, 'queued'))
      .limit(CONCURRENCY);

    for (const job of pendingJobs) {
      await processJob(job.id);
    }

    // Sleep
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Start the worker
run().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
