import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@thecueroom/db/schema';

const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'postgresql://postgres:') + '/postgres' || '';

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!db) {
    client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
