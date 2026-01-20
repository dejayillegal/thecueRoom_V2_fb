import { db } from './index';
import { feedIngestionConfig } from './schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Retrieves the current ingestion configuration.
 * Creates a default one if none exists.
 */
export async function getIngestionConfig() {
  const configs = await db.select().from(feedIngestionConfig).limit(1);
  if (configs.length > 0) {
    return configs[0];
  }

  // Create default config if missing
  const [newConfig] = await db.insert(feedIngestionConfig).values({
    enabled: true,
    intervalMinutes: 60,
    isRunning: false,
    updatedAt: new Date(),
  }).returning();

  return newConfig;
}

/**
 * Attempts to mark ingestion as started by setting is_running to true.
 * Returns true if the lock was successfully acquired, false otherwise.
 */
export async function markIngestionStarted() {
  const config = await getIngestionConfig();

  // Atomically update is_running to true only if it's currently false
  const updated = await db
    .update(feedIngestionConfig)
    .set({
      isRunning: true,
      lastRunAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(feedIngestionConfig.id, config.id),
        eq(feedIngestionConfig.isRunning, false)
      )
    )
    .returning();

  return updated.length > 0;
}

/**
 * Marks ingestion as completed by setting is_running to false and updating next_run_at.
 */
export async function markIngestionCompleted() {
  const config = await getIngestionConfig();
  const nextRun = new Date();
  nextRun.setMinutes(nextRun.getMinutes() + config.intervalMinutes);

  await db
    .update(feedIngestionConfig)
    .set({
      isRunning: false,
      nextRunAt: nextRun,
      updatedAt: new Date(),
      lastError: null,
    })
    .where(eq(feedIngestionConfig.id, config.id));
}

/**
 * Marks ingestion as failed by setting is_running to false and recording the error.
 */
export async function markIngestionFailed(error: string) {
  const config = await getIngestionConfig();
  
  await db
    .update(feedIngestionConfig)
    .set({
      isRunning: false,
      lastError: error,
      updatedAt: new Date(),
    })
    .where(eq(feedIngestionConfig.id, config.id));
}
