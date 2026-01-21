import { runEnhancedIngestion } from '../../scripts/enhanced-ingest';
import { 
  getIngestionConfig, 
  markIngestionStarted, 
  markIngestionCompleted, 
  markIngestionFailed 
} from './ingestion';

let isSchedulerRunning = false;

/**
 * Internal background scheduler for feed ingestion.
 * Runs every 60 seconds and checks if ingestion is due.
 */
export async function startIngestionScheduler() {
  if (isSchedulerRunning) {
    console.log('⏳ Ingestion scheduler is already active.');
    return;
  }

  isSchedulerRunning = true;
  console.log('🚀 Internal feed ingestion scheduler started.');

  // Run the loop every 60 seconds
  setInterval(async () => {
    try {
      const config = await getIngestionConfig();

      if (!config.enabled) {
        return;
      }

      const now = new Date();
      // If no last run, it's the first run, so we should trigger immediately
      const isFirstRun = !config.lastRunAt;
      const nextRun = config.nextRunAt ? new Date(config.nextRunAt) : new Date(0);

      if ((isFirstRun || now >= nextRun) && !config.isRunning) {
        console.log(isFirstRun ? '🆕 First-run ingestion trigger started...' : '🕒 Scheduled ingestion trigger started...');
        
        const acquired = await markIngestionStarted();
        if (!acquired) {
          console.log('🔒 Ingestion lock already held, skipping cycle.');
          return;
        }

        try {
          const result = await runEnhancedIngestion();
          
          if (result.success) {
            await markIngestionCompleted();
            console.log('✅ Scheduled ingestion completed successfully.');
          } else {
            const errorMsg = result.message || 'Ingestion failed without specific message';
            await markIngestionFailed(errorMsg);
            console.error(`❌ Scheduled ingestion failed: ${errorMsg}`);
          }
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          await markIngestionFailed(errorMsg);
          console.error(`❌ Fatal error during scheduled ingestion: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error in ingestion scheduler loop:', error);
    }
  }, 60000); // 60 seconds
}
