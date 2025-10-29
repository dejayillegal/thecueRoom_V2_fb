import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sources } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { sources } });

async function seedSources() {
  console.log('Starting sources seed...\n');

  const sourcesPath = join(__dirname, '../data/sources.json');
  const sourcesData = JSON.parse(readFileSync(sourcesPath, 'utf-8'));

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const source of sourcesData) {
    if (!source.url || !source.name) {
      console.log(`⚠ Skipping invalid source: ${JSON.stringify(source)}`);
      skipped++;
      continue;
    }

    try {
      const existing = await db
        .select()
        .from(sources)
        .where(eq(sources.url, source.url))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(sources)
          .set({
            name: source.name,
            kind: source.kind || 'rss',
            tags: source.tags || [],
            enabled: source.enabled !== false,
          })
          .where(eq(sources.url, source.url));

        console.log(`✓ Updated: ${source.name}`);
        updated++;
      } else {
        await db.insert(sources).values({
          name: source.name,
          url: source.url,
          kind: source.kind || 'rss',
          tags: source.tags || [],
          enabled: source.enabled !== false,
        });

        console.log(`✓ Added: ${source.name}`);
        added++;
      }
    } catch (error: any) {
      console.error(`✗ Failed to process ${source.name}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n✓ Seeding complete: ${added} added, ${updated} updated, ${skipped} skipped`);
  await client.end();
}

const isMainModule = typeof require !== 'undefined' && require.main === module;

if (isMainModule) {
  seedSources().catch(console.error);
}

export { seedSources };