
export * from './schema';
export * from './zodSchemas';
export { getDbClient, closeDbClient, type DbClient } from './client';

import { getDbClient } from './client';
export const db = getDbClient();
