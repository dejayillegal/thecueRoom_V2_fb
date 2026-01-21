
export * from './schema';
export * from './zodSchemas';
export { getDbClient, closeDbClient, type DbClient } from './client';

import { getDbClient } from './client';
import { IngestionService } from './ingestion';

export const db = getDbClient();

// Opportunistically trigger ingestion on database access
// This ensures that system activity drives the ingestion without external cron.
if (typeof window === 'undefined') {
  IngestionService.trigger();
}
