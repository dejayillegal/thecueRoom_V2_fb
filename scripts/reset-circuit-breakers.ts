
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { sources } });

async function resetCircuitBreakers() {
  console.log('🔄 Resetting circuit breakers for all sources...\n');

  const result = await db
    .update(sources)
    .set({
      consecutiveFailures: 0,
      circuitOpenUntil: null,
    })
    .returning();

  console.log(`✅ Reset ${result.length} sources\n`);
  
  await client.end();
}

resetCircuitBreakers().catch((error) => {
  console.error('Failed to reset circuit breakers:', error);
  process.exit(1);
});
