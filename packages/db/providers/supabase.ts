
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';

export function createSupabaseProvider(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 10,
    ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false,
  });
  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}
