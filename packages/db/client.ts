
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set. Please add it in Replit Secrets.');
    }

    // Use connection pooling URL for Neon (Replit PostgreSQL)
    const poolUrl = connectionString.includes('.us-east-2.aws.neon.tech')
      ? connectionString.replace('.us-east-2', '-pooler.us-east-2')
      : connectionString;

    pool = new Pool({
      connectionString: poolUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: poolUrl.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
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
