
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

export function createNeonProvider(connectionString: string) {
  const sql = neon(connectionString);
  return {
    db: drizzle(sql, { schema }),
    pool: null, // HTTP doesn't use a pool in the same way
  };
}
