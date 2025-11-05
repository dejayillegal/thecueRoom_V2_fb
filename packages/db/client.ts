
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL environment variable is not set.');
      console.error('📝 Please set up PostgreSQL:');
      console.error('   1. Open Tools → Database');
      console.error('   2. Click "Create a database"');
      console.error('   3. Copy DATABASE_URL from Database panel to Secrets');
      throw new Error('DATABASE_URL environment variable is not set. Please add it in Replit Secrets.');
    }

    // Validate the connection string format
    if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    // Use connection pooling URL for Neon (Replit PostgreSQL)
    // Neon format: postgresql://user:pass@ep-name-123456.us-east-2.aws.neon.tech/dbname
    // Pooler format: postgresql://user:pass@ep-name-123456-pooler.us-east-2.aws.neon.tech/dbname
    const poolUrl = connectionString.includes('.us-east-2.aws.neon.tech')
      ? connectionString.replace(/\.us-east-2\.aws\.neon\.tech/g, '-pooler.us-east-2.aws.neon.tech')
      : connectionString;

    // Neon requires SSL
    const isNeon = poolUrl.includes('neon.tech');
    
    pool = new Pool({
      connectionString: poolUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isNeon ? { rejectUnauthorized: false } : false,
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
