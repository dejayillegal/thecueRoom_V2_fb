
import { dbConfig } from './config';
import { getProvider } from './providers';
import * as schema from './schema';

let pool: any = null;
let db: any = null;

export function getDbClient() {
  if (!db) {
    const { provider, connectionString } = dbConfig;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }

    const { db: client, pool: p } = getProvider(provider, connectionString);
    db = client;
    pool = p;
    
    console.log(`✅ Database client initialized using ${provider} provider`);
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
