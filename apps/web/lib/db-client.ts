import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@thecueroom/db/schema';
import { getDbClient } from '@thecueroom/db';

export { getDbClient };
export type { DbClient } from '@thecueroom/db';