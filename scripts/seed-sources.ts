import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { feedsSources, feedsState } from '../packages/db/schema';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema: { feedsSources, feedsState } });

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
        .from(feedsSources)
        .where(eq(feedsSources.url, source.url))
        .limit(1);

      let sourceId: string;

      if (existing.length > 0) {
        sourceId = existing[0].id;
        await db
          .update(feedsSources)
          .set({
            name: source.name,
            kind: source.kind || 'rss',
            tags: source.tags || [],
            enabled: source.enabled !== false,
            updatedAt: new Date(),
          })
          .where(eq(feedsSources.url, source.url));

        console.log(`✓ Updated source: ${source.name}`);
        updated++;
      } else {
        const [inserted] = await db.insert(feedsSources).values({
          name: source.name,
          url: source.url,
          kind: source.kind || 'rss',
          tags: source.tags || [],
          enabled: source.enabled !== false,
        }).returning({ id: feedsSources.id });
        
        sourceId = inserted.id;
        console.log(`✓ Added source: ${source.name}`);
        added++;
      }

      // Ensure state exists for the source
      const stateExists = await db
        .select()
        .from(feedsState)
        .where(eq(feedsState.sourceId, sourceId))
        .limit(1);

      if (stateExists.length === 0) {
        await db.insert(feedsState).values({
          sourceId: sourceId,
          nextFetchAt: new Date(), // Immediate fetch
        });
        console.log(`  + Initialized state for: ${source.name}`);
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
