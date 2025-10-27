
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
    
    client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: true,
      transform: {
        undefined: null,
      },
      types: {
        date: {
          to: 1184,
          from: [1082, 1083, 1114, 1184],
          serialize: (x: Date | string) => {
            if (typeof x === 'string') return x;
            return x.toISOString();
          },
          parse: (x: string) => x,
        },
      },
    });
    
    db = drizzle(client, { schema });
  }
  return db;
}

export function closeDbConnection() {
  if (client) {
    client.end({ timeout: 5 });
    client = null;
    db = null;
  }
}

export { schema };
