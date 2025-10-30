
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    db = drizzle(pool, { schema });
    
    console.log('✅ Database client initialized');
  }

  return db;
}

export async function closeDbClient() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log('🔌 Database connection closed');
  }
}

export { schema };
export type DbClient = ReturnType<typeof getDbClient>;
