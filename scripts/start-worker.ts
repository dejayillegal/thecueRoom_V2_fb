#!/usr/bin/env tsx

import { startWorker } from '../packages/worker/index';

async function main() {
  console.log('\n🚀 Starting thecueRoom Background Feed Worker...\n');
  
  try {
    await startWorker();
    
    process.on('SIGINT', async () => {
      console.log('\n\n👋 Shutting down worker gracefully...\n');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\n👋 Shutting down worker gracefully...\n');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Worker failed to start:', error);
    process.exit(1);
  }
}

main();
