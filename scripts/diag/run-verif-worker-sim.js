#!/usr/bin/env node

/**
 * Diagnostic script to simulate verification worker load
 * Tests concurrent job processing and memory usage
 */

const { getDbClient } = require('../../packages/db/client');
const { verificationJobs, users, profiles } = require('../../packages/db/schema');

const VERIF_CONCURRENCY = parseInt(process.env.VERIF_CONCURRENCY || '2');
const TEST_JOB_COUNT = 10;

async function createTestJobs() {
  const db = getDbClient();
  const jobs = [];

  console.log('🔧 Creating test verification jobs...');

  for (let i = 0; i < TEST_JOB_COUNT; i++) {
    try {
      const [user] = await db.insert(users).values({
        email: `test-verif-${i}-${Date.now()}@example.com`,
        username: `testuser${i}${Date.now()}`,
        passwordHash: 'test',
        verificationStatus: 'pending_ai',
      }).returning();

      await db.insert(profiles).values({
        userId: user.id,
        artistName: `Test Artist ${i}`,
        displayName: `Test Artist ${i}`,
      });

      const [job] = await db.insert(verificationJobs).values({
        userId: user.id,
        profileUrl: `https://soundcloud.com/test-artist-${i}`,
        status: 'queued',
        progress: 0,
      }).returning();

      jobs.push(job);
      console.log(`  ✓ Created job ${i + 1}/${TEST_JOB_COUNT} (${job.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to create job ${i + 1}:`, error.message);
    }
  }

  return jobs;
}

async function monitorWorkerPerformance(durationMs = 30000) {
  console.log('\n📊 Monitoring worker performance...');
  console.log(`Duration: ${durationMs / 1000}s`);
  console.log(`Expected concurrency: ${VERIF_CONCURRENCY}\n`);

  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  const db = getDbClient();
  let lastStatus = {};

  const interval = setInterval(async () => {
    try {
      const queuedCount = await db.select().from(verificationJobs)
        .where(eq(verificationJobs.status, 'queued'));
      const processingCount = await db.select().from(verificationJobs)
        .where(eq(verificationJobs.status, 'processing'));
      const completedCount = await db.select().from(verificationJobs)
        .where(eq(verificationJobs.status, 'completed'));

      const currentMemory = process.memoryUsage();
      const memoryDelta = (currentMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

      console.log(`[${((Date.now() - startTime) / 1000).toFixed(1)}s] ` +
        `Queued: ${queuedCount.length} | ` +
        `Processing: ${processingCount.length} | ` +
        `Completed: ${completedCount.length} | ` +
        `Memory: ${memoryDelta > 0 ? '+' : ''}${memoryDelta.toFixed(2)}MB`);

      if (Date.now() - startTime >= durationMs) {
        clearInterval(interval);
        
        console.log('\n' + '━'.repeat(60));
        console.log('📈 Performance Summary:');
        console.log(`  Duration: ${(durationMs / 1000)}s`);
        console.log(`  Jobs completed: ${completedCount.length}/${TEST_JOB_COUNT}`);
        console.log(`  Memory increase: ${memoryDelta.toFixed(2)}MB`);
        console.log(`  Peak concurrency: ${Math.max(...Object.values(lastStatus))} (expected: ${VERIF_CONCURRENCY})`);
        
        if (memoryDelta > 50) {
          console.log('\n⚠️  WARNING: Memory usage exceeded 50MB');
        } else {
          console.log('\n✅ PASS: Memory usage within acceptable limits');
        }
        
        process.exit(0);
      }
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, 2000);
}

async function runDiagnostics() {
  console.log('🚀 Verification Worker Performance Diagnostic');
  console.log('━'.repeat(60));
  console.log(`TEST_MODE: ${process.env.TEST_MODE || 'false'}`);
  console.log(`VERIF_CONCURRENCY: ${VERIF_CONCURRENCY}`);
  console.log(`Test Jobs: ${TEST_JOB_COUNT}\n`);

  const jobs = await createTestJobs();
  
  if (jobs.length === 0) {
    console.error('❌ Failed to create test jobs');
    process.exit(1);
  }

  console.log(`\n✓ Created ${jobs.length} test jobs`);
  console.log('Worker should pick them up automatically...\n');

  await monitorWorkerPerformance(30000);
}

runDiagnostics().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
