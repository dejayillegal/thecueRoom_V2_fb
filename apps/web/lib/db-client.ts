import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@thecueroom/db/schema';

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Set it in your .env file with your PostgreSQL/Supabase connection string. ' +
      'Example: postgresql://user:password@host:5432/database'
    );
  }
  
  return connectionString;
}

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDbClient() {
  if (!db) {
    const connectionString = getConnectionString();
    client = postgres(connectionString);
    db = drizzle(client, { schema });
  }
  return db;
}

export { schema };
