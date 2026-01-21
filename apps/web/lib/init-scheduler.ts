import { IngestionService } from '@thecueroom/db/ingestion';

let initialized = false;

export function initScheduler() {
  if (initialized) return;
  
  // Ensure this only runs on the server
  if (typeof window === 'undefined') {
    IngestionService.trigger();
    initialized = true;
  }
}
