
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../packages/db/schema';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Check if tables exist
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sources', 'feeds')
    `;
    
    if (result.length === 0) {
      console.log('Tables not found. Please run migrations first:');
      console.log('  cd packages/db && pnpm migrate');
      process.exit(1);
    }
    
    console.log(`Found ${result.length} tables`);
    console.log('✓ Database is ready');
    
  } catch (error) {
    console.error('Database setup error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
