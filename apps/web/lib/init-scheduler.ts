import { startIngestionScheduler } from '@thecueroom/db/scheduler';

let initialized = false;

export function initScheduler() {
  if (initialized) return;
  
  // Ensure this only runs on the server
  if (typeof window === 'undefined') {
    startIngestionScheduler().catch(err => {
      console.error('Failed to start ingestion scheduler:', err);
    });
    initialized = true;
  }
}
