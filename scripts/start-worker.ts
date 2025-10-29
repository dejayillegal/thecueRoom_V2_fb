import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { sources } from '@thecueroom/db/schema';
import { ingestBatch } from '@thecueroom/worker';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { sources } });

let isRunning = false;
let intervalTimer: NodeJS.Timeout | null = null;

async function runWorkerCycle() {
  if (isRunning) {
    console.log('⏸️  Worker already running, skipping this cycle');
    return;
  }

  isRunning = true;
  const cycleStart = Date.now();

  try {
    console.log('🚀 Starting thecueRoom Background Feed Worker cycle...\n');

    const allSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    if (allSources.length === 0) {
      console.log('⚠️  No enabled sources found in database.');
      return;
    }

    console.log(`📊 Processing ${allSources.length} sources...\n`);

    const result = await ingestBatch(allSources, 10);

    const cycleDuration = ((Date.now() - cycleStart) / 1000).toFixed(2);

    console.log('\n✨ Worker cycle complete!');
    console.log(`✅ Successful: ${result.successful}/${allSources.length}`);
    console.log(`❌ Failed: ${result.failed}/${allSources.length}`);
    console.log(`📝 Total items imported: ${result.totalImported}`);
    console.log(`⏭️  Total duplicates skipped: ${result.totalSkipped}`);
    console.log(`⏱️  Cycle duration: ${cycleDuration}s\n`);
  } catch (error) {
    console.error('❌ Worker cycle error:', error);
  } finally {
    isRunning = false;
  }
}

function startPeriodicWorker() {
  const intervalMinutes = parseInt(process.env.INGEST_INTERVAL_MINUTES || '60', 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`⏰ Starting periodic worker (every ${intervalMinutes} minutes)\n`);

  // Run immediately
  runWorkerCycle();

  // Schedule periodic runs
  intervalTimer = setInterval(() => {
    runWorkerCycle();
  }, intervalMs);
}

function stopWorker() {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  console.log('🛑 Worker stopped');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down worker...');
  stopWorker();
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down worker...');
  stopWorker();
  await client.end();
  process.exit(0);
});

// Start the periodic worker
startPeriodicWorker();