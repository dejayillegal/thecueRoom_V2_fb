
import { runEnhancedIngestion } from './enhanced-ingest';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour default

interface IngestConfig {
  enabled: boolean;
  intervalMinutes: number;
}

let isRunning = false;
let currentTimer: NodeJS.Timeout | null = null;
let config: IngestConfig = {
  enabled: true,
  intervalMinutes: parseInt(process.env.INGEST_INTERVAL_MINUTES || '60', 10),
};

async function runIngest() {
  if (isRunning) {
    console.log('⏸️  Ingest already running, skipping this cycle');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Starting periodic ingest (interval: ${config.intervalMinutes}m)`);
    await runEnhancedIngestion();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Periodic ingest completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Periodic ingest failed:', error);
  } finally {
    isRunning = false;
  }
}

function startPeriodicIngest() {
  if (currentTimer) {
    clearInterval(currentTimer);
  }

  const intervalMs = config.intervalMinutes * 60 * 1000;
  console.log(`🚀 Starting periodic news ingest every ${config.intervalMinutes} minutes`);
  
  // Run immediately on start
  runIngest();
  
  // Then schedule periodic runs
  currentTimer = setInterval(() => {
    if (config.enabled) {
      runIngest();
    } else {
      console.log('⏸️  Periodic ingest is disabled');
    }
  }, intervalMs);
}

function stopPeriodicIngest() {
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
    console.log('🛑 Periodic ingest stopped');
  }
}

export function updateConfig(newConfig: Partial<IngestConfig>) {
  const oldInterval = config.intervalMinutes;
  config = { ...config, ...newConfig };
  
  console.log('⚙️  Ingest config updated:', config);
  
  // Restart if interval changed
  if (newConfig.intervalMinutes && newConfig.intervalMinutes !== oldInterval) {
    console.log(`🔄 Restarting with new interval: ${config.intervalMinutes}m`);
    startPeriodicIngest();
  }
}

export function getConfig(): IngestConfig {
  return { ...config };
}

// Auto-start if run directly
if (require.main === module) {
  startPeriodicIngest();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down periodic ingest...');
    stopPeriodicIngest();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down periodic ingest...');
    stopPeriodicIngest();
    process.exit(0);
  });
}

export { startPeriodicIngest, stopPeriodicIngest };
