#!/usr/bin/env tsx

import { runEnhancedIngestion } from './enhanced-ingest';

async function runWorker() {
  console.log('🚀 Starting thecueRoom Background Feed Worker...\n');

  // Initial fetch
  await runEnhancedIngestion();

  // Schedule to run every hour
  setInterval(async () => {
    console.log('\n⏰ Running scheduled ingestion...');
    await runEnhancedIngestion();
  }, 60 * 60 * 1000); // 1 hour
}

runWorker().catch((error) => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});