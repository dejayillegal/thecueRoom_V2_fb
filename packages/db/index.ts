
export * from './schema';
export * from './zodSchemas';
export { getDbClient, closeDbClient, type DbClient } from './client';

import { getDbClient } from './client';

export const db = getDbClient();

/**
 * Opportunistically trigger ingestion on database access.
 * This ensures that system activity drives the ingestion without external cron.
 * Using a dynamic import to avoid circular dependency / initialization issues.
 */
if (typeof window === 'undefined') {
  import('./ingestion').then(({ IngestionService }) => {
    IngestionService.trigger();
  }).catch(err => {
    console.error('[DB] Failed to trigger ingestion:', err);
  });
}
